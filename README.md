# SecureAI Tools

Private and secure AI tools for everyone's productivity.

[![Discord](https://dcbadge.vercel.app/api/server/YTyPGHcYP9?style=flat&compact=true)](https://discord.gg/YTyPGHcYP9)


## Install

### Docker Compose [Recommended]

#### 1. Create a directory
```
mkdir secure-ai-tools && cd secure-ai-tools
```


#### 2. Run set-up script
The script downloads `docker-compose.yml` and generates a `.env` file with sensible defaults.
```sh
curl -sL https://github.com/SecureAI-Tools/SecureAI-Tools/releases/latest/download/set-up.sh | sh
```


#### 3. [Optional] Edit `.env` file
Customize the `.env` file created in the above step to your liking.

#### 4. [Optional] On Linux machine with Nvidia GPUs, enable GPU support
To accelerate inference on Linux machines, you will need to enable GPUs. This is not strictly required as the inference service will run on CPU-only mode as well, but it will be slow on CPU. So if your machine has Nvidia GPU then this step is recommended.

1. Install [Nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#installation) if not already installed.
1. Uncomment the `deploy:` block in `docker-compose.yml` file. It gives inference service access to Nvidia GPUs.


#### 5. Run docker compose
```sh
docker compose up -d
```


#### 6. Post-installation set-up

1. Login at http://localhost:28669/log-in using the initial credentials below, and change the password.

    * Email

      ```
      bruce@wayne-enterprises.com
      ```
    * Password

      ```
      SecureAIToolsFTW!
      ```
1. Set up the AI model by going to http://localhost:28669/-/settings?tab=ai
1. Navigate to http://localhost:28669/- and start using AI tools
