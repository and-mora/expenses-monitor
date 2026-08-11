# Storage Allocation Implementation Plan

## Purpose and delivery model

This plan converts [the storage allocation design](STORAGE_ALLOCATION_DESIGN.md)
into small, reviewable changes. It separates:

- **Repository PRs:** reviewed, testable changes to manifests, Terraform, and
  documentation. A PR must not activate an unsafe storage cutover by itself.
- **OCI/VM change windows:** manual changes on the Oracle VM or in OCI. They
  require a named operator, a backup/recovery path, live validation, and a
  recorded outcome.
- **Decision gates:** evidence that can select an alternative or stop a later
  task. They are not assumptions to work around.

Run only one stateful cutover at a time on this single-node MicroK8s cluster.
Retain the old data location after every cutover for the stated validation
period; do not delete claims, PVs, hostpath directories, volumes, or backups
as part of this programme.

## Free-tier constraints that change the design

The initial design assumed 150 GiB observability storage, a 50 GiB database
volume, 20 GiB local PVCs, 30-day object retention, and hourly Block Volume
backups. Those assumptions must be adjusted to the OCI Always Free budget.

| OCI Always Free resource | Limit | Implementation consequence |
| --- | ---: | --- |
| Boot and Block Volumes combined | 200 GB in the home region | The verified boot volume is 47 GB and the attached data Block Volume is 50 GB, totalling 97 GB. This leaves a theoretical 103 GB only if no other volumes consume the tenancy allocation. |
| Additional Block Volumes | Permitted within the same 200 GB total | A new 50 GB database volume is a viable alternative to expanding the existing data volume if at least 50 GB remains. It creates a clean persistence boundary but does not add free capacity beyond the 200 GB pool. |
| Object Storage | 20 GB combined Always Free allocation | Do not commit 30-day Loki and Tempo retention until measured compressed object growth fits the actual available budget. Current Loki use alone is 26 GiB for seven local days, so 30 days of logs cannot be assumed to fit. |
| Volume backups | Five total free backups | Hourly Block Volume backups are incompatible with the free tier. Do not claim an hourly RPO based on volume backups. |

Sources: [OCI Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm),
[resizing volumes](https://docs.oracle.com/en-us/iaas/Content/Block/Tasks/resizingavolume.htm),
and [Block Volume backups](https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/blockvolumebackups.htm).

### Free-tier target allocation

Use the following as a **planning envelope**, not as a claim that OCI capacity
is available:

| Allocation | Candidate size | Decision |
| --- | ---: | --- |
| Existing boot volume | Keep current size initially | Do not expand until supported cleanup and volume-pool headroom are proven. Root pressure is handled first by finding and reducing supported runtime/log retention. |
| Existing `/extended-volume` | Keep current 49 GiB initially | It remains the observability working volume during migration. Loki must be bounded before any new local claim is created. |
| New `/database-volume` | 50 GB, only if OCI shows at least 50 GB free | Preferred isolation for PostgreSQL. Attach instead of expanding the existing volume. If unavailable, defer the database move and improve backup/recovery on the existing volume. |
| Object Storage | Budget must be measured and reserved | First reserve enough space for PostgreSQL base backups and WAL. Trial Tempo next. Loki object storage is conditional on measured growth; it is not a free-tier default. |

The current 20 GB MicroK8s runtime data under `/var/snap` cannot be moved merely
by adding an observability volume. Any move of MicroK8s/container-runtime data
requires a separately tested, supported host migration procedure. Do not bind
mount or manually move runtime directories in production without that proof.

### Recovery objective adjustment

The one-hour target remains appropriate for PostgreSQL only when continuous WAL
archiving and tested point-in-time recovery are implemented. The target is not
proven by the free five-backup quota.

For Prometheus, an hourly RPO is not feasible using only the free volume-backup
quota. Until a paid remote-write/metrics backend is approved, treat Prometheus
as a 15-day-or-less local cache with an explicitly accepted VM-loss gap.

For Loki and Tempo, the recovery objective depends on successful object writes
and the local WAL flush behaviour of the tested chart version. It must be
measured during cutover rather than promised in advance.

## Required evidence before any PR

This is **Task 0** and creates no PR or live change. Store redacted results in
the eventual PR-1 evidence document.

1. Verify OCI home region, the combined size of **all** boot and block volumes,
   remaining Always Free allocation, existing backup count, and whether other
   resources use the pool.
2. Record OCI volume IDs, attachment state, filesystem UUIDs, partitions,
   `/etc/fstab`, mount options, free space, and inode use. Do not commit OCI
   IDs or tenancy identifiers.
3. Map every live PV/PVC to its StorageClass, host path, mounted pod path, and
   actual directory size. Resolve the duplicate-default StorageClass condition.
4. Explain the root-volume consumers: the 20 GiB MicroK8s runtime tree, 6.9
   GiB Docker overlay, and 5.3 GiB `/var/log`. Identify supported retention or
   garbage-collection controls before removing any data.
5. Render the installed Helm releases and resolve why Prometheus has no live
   PVC despite repository intent. Capture its real TSDB path, retention, WAL
   behaviour, and disk use.
6. Measure one week of compressed Loki and Tempo object growth in a
   non-production prefix or equivalent isolated test. Include object count,
   request count, and lifecycle/deletion behaviour.
7. Perform an isolated PostgreSQL logical restore, then design and test
   continuous WAL archiving before scheduling a database migration.

**Gate:** the plan cannot move beyond Task 0 without an evidence table whose
entries are labelled **verified live**, **repository-derived**, or
**requires decision**.

### Task 0 result

Task 0 completed on 2026-08-11. Its redacted inventory and unresolved decision
gates are recorded in
[STORAGE_MIGRATION_EVIDENCE.md](STORAGE_MIGRATION_EVIDENCE.md). In particular,
the existing OCI Block Volume backup path is failing due to quota exhaustion,
PostgreSQL recovery has not been restore-tested, and no Object Storage trial
bucket exists.

**Selected Object Storage outcome: no telemetry object store.** Loki's current
26 GiB local dataset already exceeds the combined 20 GB Always Free allowance,
before Tempo, PostgreSQL backup capacity, lifecycle headroom, or measured
compressed growth. Retain bounded telemetry locally. A future Tempo-only pilot
requires a private trial bucket, least-privilege credentials, and evidence that
its compressed growth fits a reserved budget. A 30-day Loki or Tempo target
requires paid Object Storage approval.

## Iterative delivery backlog

### PR-1 — Record the evidence and make the design free-tier aware

**Repository change: yes.** No OCI/VM mutation and no workload configuration
change.

| Item | Required content |
| --- | --- |
| Objective | Commit the redacted inventory and update the design where it conflicts with verified free-tier limits. |
| Paths | `docs/STORAGE_MIGRATION_EVIDENCE.md`, `docs/STORAGE_ALLOCATION_DESIGN.md`, and this plan if decisions change it. |
| Acceptance | The document states the verified total volume allocation, backup count, active StorageClass defaults, PV mappings, Prometheus storage truth, and Object Storage capacity decision. |
| Rollback | Revert documentation only. |
| Owner/review | `ubuntu-oci-sre` prepares the evidence; `docs-architect` reviews accuracy. |
| Dependency | Task 0 complete. |

The PR must explicitly choose one of these object-storage outcomes:

1. **Tempo-only:** use Object Storage for Tempo if measured data fits the free
   budget after reserving PostgreSQL backup capacity.
2. **No telemetry object store:** retain short local telemetry windows if the
   20 GB budget does not fit.
3. **Paid Object Storage approved:** retain the 30-day Loki and Tempo target
   and record a monthly cost guardrail.

**Selected outcome:** **No telemetry object store.** The Tempo pilot and Loki
object-store work are deferred unless a later capacity decision changes this
outcome.

### Window A — Recover safe root-volume headroom

**Repository change: no.** This is a manual, controlled VM operation.

| Item | Required content |
| --- | --- |
| Objective | Bring `/` below 70% using supported log rotation and verified image/runtime garbage collection; avoid a root-full outage. |
| Preconditions | Current OCI backup/recovery path, second SSH or console path, Task 0 ownership mapping, and an approved rollback operator. |
| Work | Configure bounded journald/kubelet/container log retention where supported; prune only verified unused artifacts through their owning tool. |
| Acceptance | Root use below 70%, MicroK8s and all workloads healthy, and before/after measurements recorded. |
| Abort | Unknown ownership, a failing backup, or a workload becoming unhealthy. |
| Rollback | Restore supported retention configuration; do not restore deleted data manually. |
| Owner/review | `ubuntu-oci-sre`. |

If supported cleanup cannot bring root use below 70%, open a new decision item:
test a vendor-supported runtime-data migration to an attached volume in a
non-production environment, or approve paid boot-volume expansion. This is
not part of the storage migrations below.

### Window B — Attach an isolated database volume, if free capacity permits

**Repository change: no.** Conditional manual OCI/VM operation.

| Item | Required content |
| --- | --- |
| Objective | Attach a new 50 GB OCI Block Volume at `/database-volume` without moving application data. |
| Preconditions | PR-1 verifies at least 50 GB remaining in the Always Free pool, same availability domain, backup allocation, console recovery, and filesystem plan. |
| Work | Attach, format, mount by UUID with `_netdev,noatime`, set ownership only after the intended workload identity is verified, then reboot-test. |
| Acceptance | Correct UUID, persistent mount, free-space/inode monitoring, and all existing services recover after the controlled reboot. |
| Rollback | Detach only while unused. After any data is written, preserve the volume until a separate retention decision. |
| Owner/review | `ubuntu-oci-sre`. |

If this window is not viable, PostgreSQL stays on the existing volume. Later
database work is limited to backup/PITR until paid capacity or a replacement
architecture is approved.

### PR-2 — Add inert backup and secret-delivery foundations

**Repository change: yes.** This PR must not change a live Loki, Tempo, or
PostgreSQL storage backend.

| Item | Required content |
| --- | --- |
| Objective | Add only the configuration scaffolding needed for an approved backup/object-store path. |
| Paths | Terraform module **only if** Task 0 proves this repository owns OCI state; otherwise `docs/` runbook. Add chart-supported Sealed Secret templates or external-secret references as appropriate. |
| Acceptance | Separate least-privilege identities per consumer; no Customer Secret Key in Git or Terraform state; lifecycle matches the selected free-tier outcome; non-production-prefix access works and cross-bucket access fails. |
| Rollback | Remove unused secrets, IAM permissions, and buckets only after verifying no consumer. |
| Owner/review | `devsecops` implements; `ubuntu-oci-sre` validates OCI connectivity; `docs-architect` reviews recovery/lifecycle documentation. |
| Dependency | PR-1 and an approved object-storage outcome. |

PostgreSQL backups are prioritised over observability data. The implementation
must use application-consistent base backups plus continuous WAL archiving, not
Block Volume backups as a database substitute.

### PR-3 — Tempo pilot

**Repository change: yes.** One workload cutover in a dedicated change window.

| Item | Required content |
| --- | --- |
| Objective | Move Tempo to the approved object-store backend while retaining a small local WAL/cache claim. |
| Paths | `manifest/tempo/values.yaml` and only chart-supported templates needed for credentials/configuration; `docs/` cutover and rollback instructions. |
| Preconditions | PR-2 successful access test, object-budget reservation, rendered chart validation, and Window A root-health acceptance. |
| Acceptance | Trace ingestion, TraceQL queries, compaction, retention deletion, restart recovery, local WAL bound, and actual bucket growth are recorded for seven days. |
| Rollback | Revert the exact Helm values and retain the untouched prior PVC. |
| Owner/review | `devsecops` implements; `ubuntu-oci-sre` validates capacity and recovery. |
| Dependency | PR-2. |

Do not set a 30-day retention value unless the pilot demonstrates that the
reserved Object Storage budget supports it.

### PR-4 — Loki decision and implementation

**Repository change: conditional.** Create this PR only if the Tempo pilot and
the measured Loki size establish that the selected storage budget is viable.

| Outcome | PR action |
| --- | --- |
| Loki fits approved Object Storage budget | Configure the Loki S3 backend for chunks, TSDB index, rules, compactor delete requests, and bounded local WAL/workdir. Test one cutover window, then retain the legacy PVC for the full validation period. |
| Loki does not fit the free budget | Do **not** add an object-store backend. Create a small PR that sets an explicitly accepted local retention/size policy and adds disk alerts. The 30-day Loki target is deferred pending paid storage approval. |

For either outcome, the PR paths are `manifest/loki/values.yaml`, required
chart-supported secret/config templates, and `docs/`. It requires separate
acceptance checks for ingest, historical queries, rulers, compaction/deletion,
restart recovery, and actual volume/bucket growth.

**Owner/review:** `devsecops` implements; `ubuntu-oci-sre` reviews capacity and
rollback. **Dependency:** PR-3's seven-day evidence.

### PR-5 — PostgreSQL PITR and optional dedicated-volume cutover

**Repository change: yes.** The storage move portion runs only in a separately
approved maintenance window.

| Item | Required content |
| --- | --- |
| Objective | Implement, test, and document PostgreSQL base backups, WAL archiving, PITR, and—only if Window B succeeded—an explicit database persistence target. |
| Paths | `manifest/postgresql/values.yaml`, chart-supported backup/CronJob templates, secret references, and PostgreSQL restore/cutover documentation in `docs/`. |
| Preconditions | Successful isolated logical restore and PITR drill; approved maintenance window; verified backup capacity; application and Keycloak smoke checks. |
| Acceptance | One active PostgreSQL writer, successful application and Keycloak validation, backup freshness alert, and documented restore result. |
| Rollback | Keep the new writer stopped and restart the former instance against its original untouched claim. Never allow concurrent writers against the same data directory. |
| Owner/review | `backend-rust` implements database-facing behaviour; `devsecops` reviews secrets/delivery; `ubuntu-oci-sre` signs off storage/recovery. |
| Dependency | PR-2; Window B only for the physical move. |

### PR-6 — Reconcile remaining state and prove operations

**Repository change: yes.** This is the final configuration PR, not a batch
migration.

| Item | Required content |
| --- | --- |
| Objective | Explicitly configure Prometheus, Grafana, and Alertmanager persistence after their live state is understood; add capacity and backup-health observability. |
| Paths | `manifest/monitoring/values.yaml`, applicable dashboards/rules under `monitoring/`, and `docs/` restore procedures. |
| Preconditions | Task 0 resolves Prometheus storage; any local PVC size fits the verified remaining Block Volume budget; no concurrent stateful migration. |
| Acceptance | Claims use explicit StorageClasses; Prometheus retention/size is explicitly accepted as local-cache protection; Grafana and Alertmanager state restore successfully; alerts fire for root/volume capacity, inodes, backup age/failure, WAL archival, and object-store errors. |
| Rollback | Revert Helm values without deleting newly created claims. Document any accepted Prometheus gap. |
| Owner/review | `devsecops` implements; `ubuntu-oci-sre` validates live storage; `docs-architect` reviews runbooks. |
| Dependency | PR-5 complete and seven-day stability after the previous stateful cutover. |

## Mandatory pull-request controls

Every implementation PR must contain:

1. A preflight section stating what is **verified live**, **repository-derived**,
   and **still unknown**.
2. The exact production change window required, or an explicit statement that
   the PR is inert.
3. Acceptance signals, abort criteria, and rollback instructions.
4. A declaration that no existing data, PVC, PV, volume, or bucket is deleted.
5. Full relevant repository validation and a manual verification checklist for
   any infrastructure it cannot test locally.

## Programme completion criteria

The work is complete only when:

- Root, observability, and database capacity have alert thresholds and remain
  below the agreed operating limit.
- Every stateful workload maps to a verified persistence path and recovery
  procedure.
- PostgreSQL PITR has been restored successfully.
- Telemetry retention is measured, not assumed, and fits the approved
  Always Free or paid budget.
- Prometheus's accepted recovery limitation is documented unless an approved
  remote-write backend replaces it.
- A controlled VM-recovery exercise records what was restored, duration,
  actual data loss, and remaining gaps.
