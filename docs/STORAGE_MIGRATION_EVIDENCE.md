# Storage Migration Evidence

## Scope and evidence status

This document records the redacted Task 0 inventory collected from the
production Oracle VM and MicroK8s cluster on 2026-08-11. It makes no live
configuration change and contains no OCI identifiers, credentials, or Secret
data.

Terms used below:

- **Verified live**: directly observed on the production VM, cluster, or OCI
  Console.
- **Repository-derived**: determined from repository configuration only.
- **Requires decision**: unavailable or unproven information that blocks a
  later migration step.

## Capacity and mount inventory

| Evidence | Status | Observation | Consequence |
| --- | --- | --- | --- |
| OCI volume allocation | Verified live | Boot volume: 47 GB; attached Block Volume: 50 GB; total: 97 GB. | At most 103 GB remains in the 200 GB Always Free pool only if no other volumes consume it. Do not create or expand a volume without confirming tenancy-wide allocation. |
| Root filesystem | Verified live | `/dev/sda1` is 45 GiB, with 38 GiB used (84%) and 7.7 GiB available. | Critical capacity risk; do not perform a stateful cutover until supported cleanup restores headroom. |
| Extended filesystem | Verified live | `/extended-volume` is 49 GiB, with 27 GiB used (57%) and 21 GiB available. | Shared persistent-data failure domain with limited migration headroom. |
| Inodes | Verified live | Root and extended filesystems each use 6% of inodes. | Capacity, rather than inode exhaustion, is the immediate constraint. |
| Database volume | Verified live | `/database-volume` does not exist. | PostgreSQL has no isolated Block Volume. |
| Persistent mount | Verified live | `/extended-volume` is mounted through `/dev/oracleoci/oraclevdb` with `_netdev,noatime`. | Replace the device-path entry with a UUID-based entry only during a tested maintenance operation. |

## Root-volume ownership

| Path | Status | Measured use | Required follow-up |
| --- | --- | ---: | --- |
| `/var` | Verified live | 35 GiB | Identify supported cleanup controls before deleting anything. |
| `/var/snap` | Verified live | 21 GiB | Establish MicroK8s runtime ownership and supported retention or garbage collection. Do not move or remove runtime data manually. |
| `/var/lib` | Verified live | 8.5 GiB | Identify Docker/container-runtime ownership and use the owning runtime's supported garbage collection. |
| `/var/log` | Verified live | 5.3 GiB | Configure and validate bounded journal, kubelet, and container-log retention before cleanup. |

## Kubernetes persistence inventory

| Workload | Status | Claim and host path | Measured use | Finding |
| --- | --- | --- | ---: | --- |
| Loki | Verified live | `monitoring/storage-loki-0`, 10 GiB request, `/extended-volume/monitoring-storage-loki-0-pvc-...` | 26 GiB | Hostpath does not enforce the claim request; Loki is the dominant extended-volume consumer. |
| Grafana | Verified live | `monitoring/monitoring-grafana`, 10 GiB request, `/extended-volume/monitoring-monitoring-grafana-pvc-...` | 162 MiB | Stored on the shared extended volume. |
| PostgreSQL | Verified live | `default/data-postgresql-0`, 8 GiB request, `/extended-volume/default-data-postgresql-0-pvc-...` | 159 MiB | Stored on the shared extended volume. |
| Tempo | Verified live | `monitoring/storage-tempo-0`, 10 GiB request, `/extended-volume/monitoring-storage-tempo-0-pvc-...` | 20 KiB | Stored on the shared extended volume. |
| Prometheus | Verified live | No PVC; `/prometheus` is an unbounded `emptyDir` in the Prometheus pod. | 10 GiB | Root-backed, ephemeral TSDB and WAL; it is lost when the pod is replaced. Current retention is 10 days with WAL compression. |

Both `extended-hostpath` and `microk8s-hostpath` are marked default. Both use
the `Delete` reclaim policy, `WaitForFirstConsumer` binding, and disallow
volume expansion. The duplicate default and destructive reclaim policy must be
resolved before creating or migrating stateful claims.

## Backup and recovery inventory

| Evidence | Status | Observation | Decision gate |
| --- | --- | --- | --- |
| OCI Block Volume backups | Verified live | The monthly automatic backup has failed for months with a quota-exceeded error. | Do not claim Block Volume backup recovery until quota, retention, and a successful restore are verified. |
| PostgreSQL logical export | Repository-derived | `.github/workflows/backup_database.yml` runs a weekly `pg_dumpall`, compresses and encrypts it, then uploads it to Google Drive. | Retain as an input to recovery, but it does not provide PITR. |
| PostgreSQL restore | Verified live | The Google Drive export has never been restored and validated in an isolated PostgreSQL instance. | A successful isolated restore is mandatory before any database migration. |
| PostgreSQL PITR | Repository-derived and verified live | No WAL-archiving configuration or restore drill is recorded. | Design, implement, and test continuous WAL archiving and PITR before scheduling a database cutover. |

## Object Storage decision

| Evidence | Status | Observation | Required decision |
| --- | --- | --- | --- |
| OCI Object Storage trial | Verified live | No private trial bucket or least-privilege credentials exist. | A future Tempo-only trial requires an inert, isolated path before measuring compressed growth, object counts, requests, and lifecycle deletion. |
| Telemetry retention | Decision recorded | Loki already occupies 26 GiB locally; the Always Free Object Storage budget is 20 GB combined and no compressed-growth measurement exists. | Do not use Object Storage for telemetry. Keep bounded local retention and capacity alerts. Reconsider Tempo-only only when a measured trial fits a reserved budget; require paid Object Storage approval for 30-day Loki or Tempo retention. |

## Task 0 outcome

Task 0 is complete because the inventory explicitly labels verified facts,
repository-derived facts, and decisions that remain unproven. The next step is
PR-1: review this evidence, update the free-tier design decisions, and record
the selected Object Storage outcome. No stateful migration, PVC/PV deletion,
hostpath deletion, volume deletion, or backup deletion is authorised by this
document.
