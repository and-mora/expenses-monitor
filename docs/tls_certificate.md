# TLS certificate 

If you don't have one already associated with your domain, follow instruction from [certbot](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal).

**Bullet points**:
1. Run certbot

   ```
   sudo certbot certonly -d expmonitor.freeddns.org --standalone -v
   ```

Troubleshooting
1. it may require to open port 80 on the host machine
   ```
   sudo ufw allow 80/tcp
   ```
2. in some particular case of VM it may be needed to run a flush script on iptables:

   ```
   #!/bin/sh
   echo "Flushing iptables rules..."
   sleep 1
   iptables -F
   iptables -X
   iptables -t nat -F
   iptables -t nat -X
   iptables -t mangle -F
   iptables -t mangle -X
   iptables -P INPUT ACCEPT
   iptables -P FORWARD ACCEPT
   iptables -P OUTPUT ACCEPT
   ```