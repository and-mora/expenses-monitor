
necessary changes to make the dns outside the microk8s works
```
sudo iptables -D  INPUT -j REJECT --reject-with icmp-host-prohibited
sudo iptables -D  FORWARD -j REJECT --reject-with icmp-host-prohibited
```