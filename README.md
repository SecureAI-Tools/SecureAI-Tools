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

#### Chat with Paperless-ngx documents demo: Locally running Llama2-7b (M2 MacBook)
[![Paperless-ngx integration demo](https://img.youtube.com/vi/dSAZefKnINc/0.jpg)](https://www.youtube.com/watch?v=dSAZefKnINc)

#### Document collections demo
[![Document Collections demo](https://img.youtube.com/vi/PwvfVx8VCoY/0.jpg)](https://www.youtube.com/watch?v=PwvfVx8VCoY)

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
Customize the `.env` file created in the above step to your liking. If you want to use OpenAI LLMs, then please follow the [steps outlined here](https://github.com/SecureAI-Tools/SecureAI-Tools/#use-with-openai-or-openai-compatible-apis).

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

## Upgrade

To upgrade, please run the following command where `docker-compose.yml` file lives in your set-up (it should be in `secure-ai-tools` directory from [installation step-#1](https://github.com/SecureAI-Tools/SecureAI-Tools/tree/main?tab=readme-ov-file#1-create-a-directory)).

```sh
docker compose pull && docker compose up -d
```

## Hardware requirements

### Running AI model (LLM) locally
* RAM: As much as the AI model requires. Most models have a variant that works well on 8 GB RAM
* GPU: GPU is recommended but not required. It also runs in CPU-only mode but will be slower on Linux, Windows, and Mac-Intel. On M1/M2/M3 Macs, the inference speed is really good.

### Using remote OpenAI-compatible APIs
SecureAI Tools allows using [remote OpenAI-compatible APIs](https://github.com/SecureAI-Tools/SecureAI-Tools?tab=readme-ov-file#use-with-openai-or-openai-compatible-apis). If you only use a remote OpenAI-compatible API server for LLM inference, then the hardware requirements are much lower. You only need enough resources to be able to run a few docker containers: a small web server, postgresql-server, rabbit-mq.

## Features wishlist
A set of features on our todo list (in no particular order).

* ✅ Chat with documents
* ✅ Support for OpenAI, Claude etc APIs
* ✅ Reusable document collections
* ✅ Offline document processing
* ✅ Integration with Paperless-ngx
* ✅ Integration with Google Drive
* Support more file types (Google Doc, Docx, Markdown etc)
* Support for markdown rendering
* Chat sharing
* Mobile friendly UI
* Specify AI model at chat-creation time
* Prompt templates library

## Guides

### Use with OpenAI or OpenAI-compatible APIs
SecureAI Tools can be used with OpenAI APIs and any other provider that provides OpenAI-compatible APIs. Here are the steps to enable that for your instance:

1. Set the `MODEL_PROVIDER_CONFIGS` in `.env` file as shown below. If you're using other providers that don't require `apiKey` then you can specify any dummy `apiKey` value. Use appropriate `apiBaseUrl` depending on your API provider.

   ```.env
   # For OpenAI
   MODEL_PROVIDER_CONFIGS='[{"type":"OPENAI","apiBaseUrl":"https://api.openai.com/v1","apiKey":"sk-...","embeddingsModel":"text-embedding-3-large"}]'

   # For OpenAI-compatible other provider
   MODEL_PROVIDER_CONFIGS='[{"type":"OPENAI","apiBaseUrl":"...URL of API provider here ...","apiKey":"sk-...","embeddingsModel":"text-embedding-3-large"}]'
   ```

2. Go to the organization settings page, select OpenAI model type, and provide the appropriate model name like `gpt-4o`

### Customize LLM provider-specific options

You can customize LLM provider-specific options like the number of layers to offload to GPUs, or stop words, etc. Specify these options in the `MODEL_PROVIDER_CONFIGS` environment variable. For example, below is how we can offload 30 layers to GPUs in Ollama.

   ```.env
   MODEL_PROVIDER_CONFIGS='[{"type":"OLLAMA","apiBaseUrl":"http://inference:11434/","apiKey":"","options":{"numGpu":30}}]'
   ```
Please [see here](https://github.com/SecureAI-Tools/SecureAI-Tools/blob/5f1c253af43f6b58c34ce481650069b1f65a20df/packages/core/src/types/model-provider-config.ts#L8-L13) for more info on what options are available for which provider.
