¡Entendido! Aquí tienes la guía completa usando los términos originales en inglés para asegurarte de que no pasemos nada por alto en la configuración de **Workforce Identity Federation** entre MongoDB Atlas y **Azure Active Directory**.

---

### **Configuration in Azure Active Directory**

#### 1. **Register an Application in Azure AD**
   - Navigate to the **Azure Portal** → `Azure Active Directory` → `App registrations` → `New registration`.
   - Provide a **Name** for the application (e.g., `MongoDB Atlas Federation`).
   - Choose the **Supported account type**:
     - Typically, select "Accounts in this organizational directory only".
   - Leave the **Redirect URI** field blank, as MongoDB Atlas does not require it for federation purposes.
   - Click on `Register`.

#### 2. **Retrieve Application (Client) ID and Directory (Tenant) ID**
   - After registering the application, take note of:
     - **Application (Client) ID**: This is the unique identifier for the Azure AD application.
     - **Directory (Tenant) ID**: This is the unique identifier for your Azure AD tenant.

#### 3. **Configure API Permissions**
   - Go to the `API permissions` section within your registered application.
   - Click on `Add a permission`.
   - Choose `Microsoft Graph` → Select the relevant permissions (e.g., User.Read, or others depending on your needs).
   - Grant admin consent for the required permissions.

#### 4. **Generate a Client Secret**
   - Navigate to `Certificates & secrets` → `New client secret`.
   - Provide a **Description** for the secret (e.g., `MongoDB Atlas Client Secret`) and choose an expiration period.
   - Once created, copy the **Value** of the secret. This will be your `Client Secret` used in MongoDB Atlas.

#### 5. **Configure Token Claims**
   - Go to the `Token configuration` section within the application's settings.
   - Add custom claim mappings if necessary:
     - Ensure the `sub` claim (Subject Identifier) is included; this claim uniquely identifies the authenticated user in Azure AD. MongoDB Atlas uses the `sub` claim to identify users.

#### 6. **Capture the Issuer URL**
   - The **Issuer URL** for your Azure AD tenant is in the format:  
     ```
     https://login.microsoftonline.com/{Tenant ID}/v2.0
     ```
   - Replace `{Tenant ID}` with your Azure Directory (Tenant) ID.

---

### **Configuration in MongoDB Atlas**

#### 1. **Enable Federated Authentication**
   - Go to **MongoDB Atlas** → Select your organization.
   - Navigate to `Settings` → `Access Management` → `Authentication Methods`.
   - Under `Federated Authentication`, enable **Identity Federation**.

#### 2. **Add an Identity Provider**
   - Go to `Access Management` → `Identity Providers` → Click the `Add Identity Provider` button.
   - Input the Azure AD details:
     - **Identity Provider Type**: Select `Azure Active Directory`.
     - **Issuer URL**: Use the URL you captured earlier (`https://login.microsoftonline.com/{Tenant ID}/v2.0`).
     - **Audience**: Set this to a value that aligns with your Azure AD application. Typically, MongoDB uses `https://mongodb.com/atlas`.
     - **Client ID**: Use the Application (Client) ID from Azure AD.
     - **Client Secret**: Use the value of the Client Secret generated in Azure AD.

#### 3. **Configure Role Mapping**
   - In the `Role Mapping` section, define the mapping between Azure AD claims and MongoDB Atlas roles.
     - Specify which claims (`email`, `name`, `sub`, etc.) from the Azure AD token will determine user roles/permissions in Atlas.
     - Example: Map the claim `email` to an Atlas role such as `Organization Owner` or `Cluster Administrator`.

#### 4. **Test Authentication**
   - Use a user account from Azure AD to test the configuration:
     - Go to `Test Authentication` in MongoDB Atlas under `Identity Providers`.
     - Authenticate using Azure AD credentials and confirm user access to Atlas.

---

### **Essential Configuration Elements**

#### In Azure AD:
1. **Issuer URL**:  
   `https://login.microsoftonline.com/{Tenant ID}/v2.0`.

2. **Application (Client) ID**:  
   Unique identifier for the registered Azure AD application.

3. **Directory (Tenant) ID**:  
   Unique identifier for the Azure AD tenant.

4. **Client Secret**:  
   The secret value generated in Azure AD.

5. **Claims**:  
   Ensure the claims (e.g., `sub`, `email`, etc.) are appropriately configured in the token settings.

#### In MongoDB Atlas:
1. **Identity Provider Type**:  
   Select **Azure Active Directory**.

2. **Issuer URL**, **Audience**, **Client ID**, and **Client Secret**:  
   Match these with the values from Azure AD.

3. **Role Mapping**:  
   Map claims from Azure AD to appropriate Atlas roles like `Organization Owner`, `Project Owner`, or `Cluster Administrator`.

---

¿Te gustaría ejemplos de cómo configurar los roles o claims específicos para un caso de uso? ¡Avísame! 😊