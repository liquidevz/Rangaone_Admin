# TinyMCE Environment Variables Setup

## 📋 **Required Environment Variables**

### 1. **Update your `.env` file:**

Add this line to your `.env` file:

```bash
# TinyMCE Configuration
NEXT_PUBLIC_TINYMCE_API_KEY=no-api-key
```

### 2. **For Production - Get TinyMCE API Key:**

1. **Visit**: https://www.tiny.cloud/get-tiny/
2. **Sign up** for a free TinyMCE account
3. **Get your API key** from the dashboard
4. **Replace** `no-api-key` with your actual API key:

```bash
NEXT_PUBLIC_TINYMCE_API_KEY=your_actual_api_key_here
```

## 🎯 **Current Environment Variables**

Your `.env` file should look like this:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://stocks-backend-cmjxc.ondigitalocean.app

# TinyMCE Configuration
NEXT_PUBLIC_TINYMCE_API_KEY=no-api-key

# Optional: Admin Access (for development/testing)
ADMIN_ACCESS_TOKEN=your_admin_token_here
ADMIN_REFRESH_TOKEN=your_refresh_token_here

# Optional: Enable mock data in development  
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

## 🔧 **How to Update:**

### **Windows PowerShell:**
```powershell
# Add TinyMCE API key to .env file
Add-Content .env "`nNEXT_PUBLIC_TINYMCE_API_KEY=no-api-key"
```

### **Manual Edit:**
1. Open `.env` file in your editor
2. Add the line: `NEXT_PUBLIC_TINYMCE_API_KEY=no-api-key`
3. Save the file
4. Restart your development server

## 🚀 **Restart Development Server:**

After updating environment variables:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## 📝 **TinyMCE Features Available:**

- **Rich text formatting** (bold, italic, colors)
- **Headings and paragraphs**
- **Lists** (bulleted and numbered)
- **Links and media**
- **Code blocks**
- **Tables**
- **Search and replace**
- **Full screen editing**
- **Word count**
- **Dark theme** (matches your app)

## 🔒 **Security Notes:**

- ✅ **NEXT_PUBLIC_** prefix makes variables available to browser
- ✅ **HTML sanitization** implemented in `HtmlContent` component
- ✅ **Safe rendering** with controlled `dangerouslySetInnerHTML`
- ✅ **Script tag removal** and event handler stripping

## 🎨 **Customization:**

TinyMCE editor is configured in `components/rich-text-editor.tsx`:
- **Dark theme** with zinc color scheme
- **Comprehensive toolbar**
- **Responsive height**
- **Placeholder support**
- **Custom styling** for your app's theme 