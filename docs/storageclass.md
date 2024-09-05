
## Storage class on custom directory on microk8s

I added a block volume to my compute instance on OCI.
https://docs.oracle.com/en-us/iaas/Content/Block/References/consistentdevicepaths.htm

```
/sbin/mkfs.ext4 /dev/oracleoci/consistent-path
```
add the following to /etc/fstab
```
/dev/oracleoci/consistent-path   /mountpoint    ext4    defaults,_netdev,noatime  0  2
```


based on the following [link](https://microk8s.io/docs/addon-hostpath-storage) it is possible to customize the directory for the storageclass
```
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
  name: extended-hostpath
provisioner: microk8s.io/hostpath
parameters:
  pvDir: /extended-volume
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

In my case I attached a block volume to the compute instance and created a storageclass to fill that volume.

Ensure that only one storageclass is the default one.

```
kubectl patch storageclass standard -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
```

