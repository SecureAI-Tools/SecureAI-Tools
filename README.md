# SecureAI Tools

Private and secure AI tools for everyone's productivity.

[![Discord](https://dcbadge.vercel.app/api/server/YTyPGHcYP9?style=flat&compact=true)](https://discord.gg/YTyPGHcYP9)

## Highlights

* **Chat with AI**: Allows you to chat with AI models (i.e. ChatGPT).
* **Chat with Documents**: Allows you to chat with documents (PDFs for now). Demo videos below
* **Local inference**: Runs AI models locally. Supports 100+ open-source (and semi-open-source) AI models through [Ollama](https://ollama.ai/library).
* **Built-in authentication**: A simple email/password authentication so it can be opened to internet and accessed from anywhere.
* **Built-in user management**: So family members or coworkers can use it as well if desired.
* **Self-hosting optimized**: Comes with necessary scripts and docker-compose files to get started in under 5 minutes.

## Demos

#### Chat with documents demo: OpenAI's GPT3.5
[![Chat with documents demo: OpenAI's GPT3.5](https://img.youtube.com/vi/Br2D3G9O47s/0.jpg)](https://www.youtube.com/watch?v=Br2D3G9O47s)

#### Chat with documents demo: Locally running Mistral (M2 MacBook)
[![Chat with documents demo: Locally running Mistral](https://img.youtube.com/vi/UvRHL6f_w74/0.jpg)](https://www.youtube.com/watch?v=UvRHL6f_w74)

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
Customize the `.env` file created in the above step to your liking. If you want to use OpenAI LLMs, then please follow the steps outlined in the guides section below.

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

* ✅ Chat with documents
* ✅ Support for OpenAI, Claude etc APIs
* Support for markdown rendering
* Chat sharing
* Mobile friendly UI
* Specify AI model at chat-creation time
* Prompt templates library

## Guides

### Use with OpenAI or OpenAI-compatible APIs
SecureAI Tools can be used with OpenAI APIs and any other provider that provides OpenAI-compatible APIs. Here are the steps to enable that for your instance:

1. Set the `MODEL_PROVIDER_CONFIGS` in `.env` file as shown below. If you're using other providers that don't require `apiKey` then you can specify any dummy `apiKey` value.

   ```
   MODEL_PROVIDER_CONFIGS='[{"type":"OPENAI","apiBaseUrl":"http://127.0.0.1:5000/v1","apiKey":"sk-..."}]'
   ```

2. Go to the organization settings page, select OpenAI model type, and provide the appropriate model name like `gpt3.5-turbo`
