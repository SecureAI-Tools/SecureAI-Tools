# SecureAI Tools

Private and secure AI tools for everyone's productivity.

[![Discord](https://dcbadge.vercel.app/api/server/YTyPGHcYP9?style=flat&compact=true)](https://discord.gg/YTyPGHcYP9)

## Highlights

* **Local inference**: Runs AI models locally. Supports 100+ open-source (and semi-open-source) AI models through [Ollama](https://ollama.ai/library).
* **Built-in authentication**: A simple email/password authentication so it can be opened to internet and accessed from anywhere.
* **Built-in user management**: So family members or coworkers can use it as well if desired.
* **Self-hosting optimized**: Comes with necessary scripts and docker-compose files to get started in under 5 minutes.
* **Lightweight**: A simple web app with SQLite DB to avoid having to run docker container for DB. Data is persisted on host machine through docker volumes

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


## Features wishlist
A set of features on our todo list (in no particular order).

1. Chat with documents
2. Support for OpenAI, Claude etc APIs
3. Chat sharing
4. Mobile friendly UI
5. Specify AI model at chat-creation time
6. Support for markdown rendering
7. Prompt templates library
