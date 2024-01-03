# Configure Google Drive

To configure Google Drive for your organization, you need to obtain Google OAuth app credentials for your GSuite workspace/organization.

## How to get Google OAuth app credentials

### 1. Create a Google Cloud project
If you have a Google Cloud project, then skip this step.

<img src="/docs/images/create-google-cloud-project.png?raw=true" height="250" />

### 2. Enable Google Drive API

#### 2.1. Navigate to "Enabled APIs & services": `Left side navigation > APIs & Services > Enabled APIs & services`

<img src="/docs/images/nav-enabled-api-services.png?raw=true" height="250" />


#### 2.2. Click `Enable APIs & Services`

<img src="/docs/images/click-enable-apis-services.png?raw=true" height="250" />


#### 2.3. Search for "google drive api" 

<img src="/docs/images/search-for-google-drive-api.png?raw=true" height="150" />


#### 2.4. Click Enable to enable Google Drive API

<img src="/docs/images/click-enable-google-drive-api.png?raw=true" height="250" />


### 3. Configure OAuth consent screen

#### 3.1. Navigate to "OAuth consent screen" from left side navigation

<img src="/docs/images/nav-oauth-consent-screen.png?raw=true" height="250" />

#### 3.2 Select internal and hit create

<img src="/docs/images/select-internal-and-create.png?raw=true" height="250" />


#### 3.3 Add Google drive scopes

1. Click "Add or remove scopes"

2. Add the following scopes manually (or search for them and select)

    ```
    https://www.googleapis.com/auth/drive.readonly
    https://www.googleapis.com/auth/drive.metadata.readonly
    ```

<img src="/docs/images/select-google-drive-scopes.png?raw=true" height="250" />

### 4. Create Credential

#### 4.1 Navigate to "Credentials" from left side navigation

<img src="/docs/images/nav-credentials.png?raw=true" height="250" />

#### 4.2 Click "Create Credentials" > "OAuth client ID"

<img src="/docs/images/create-oauth-id-credential.webp" height="250" />

#### 4.3 Select "Web Application"

<img src="/docs/images/select-web-application.png" height="250" />

#### 4.4 Fill out name and mandatory email fields

<img src="/docs/images/fill-oauth-credential-mandatory-fields.png" height="250" />

#### 4.5 Configure "Authorized JavaScript origins"

* For self-hosted instances, use the host:port of your SecureAI Tools instance. i.e. `http://<ip-address-or-domain-name>:<port>` with appropriate values for your instance.

* For managed instances put `https://platform.SecureAI.tools`

<img src="/docs/images/oauth-creds-authorized-origins.png" height="250" />

#### 4.6 Configure "Authorized redirect URIs"

* For self-hosted instances, configure this to be `http://<ip-address-or-domain-name>:<port>/<org-slug>/data-sources/google_drive/connect` with appropriate values for your instance and organization.

* For managed instances, put `https://platform.secureai.tools/<your-org-slug>/data-sources/google_drive/connect` with appropriate values for `<your-org-slug>`.

<img src="/docs/images/oauth-creds-authorized-redirects.png" height="250" />

#### 4.7 Click "Create" to create the credential

#### 4.8 Download generated JSON file

Download the JSON file and upload it in the "Configure Google Drive" page of SecureAI Tools

<img src="/docs/images/download-create-oauth-json.png" height="250" />
