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

# TinyMCE Rich Text Editor - Production Setup

## Overview
This project uses TinyMCE as the rich text editor for portfolio descriptions. The integration is production-ready with proper dark theme, React 19 compatibility, and robust error handling.

## Environment Configuration

### Development
The editor works in development mode without an API key (shows a small warning banner).

### Production
For production deployment, you MUST set up a TinyMCE API key:

1. **Get Free API Key**:
   - Visit: https://www.tiny.cloud/
   - Sign up for a free account
   - Get your API key from the dashboard

2. **Set Environment Variable**:
   ```bash
   NEXT_PUBLIC_TINYMCE_API_KEY=your-actual-api-key-here
   ```

3. **Deploy Configuration**:
   - Vercel: Add to Environment Variables in dashboard
   - Netlify: Add to Site Settings > Environment Variables
   - AWS/Others: Configure in your deployment environment

## Features Included

### 📝 Rich Text Editing
- **WYSIWYG Interface**: What You See Is What You Get
- **Comprehensive Toolbar**: All essential formatting tools
- **Dark Theme**: Matches your app's zinc color scheme
- **Responsive Design**: Works on all screen sizes

### 🛠️ Toolbar Features
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3, H4, H5, H6
- **Lists**: Bullet points and numbered lists
- **Alignment**: Left, Center, Right, Justify
- **Links**: Easy link insertion and management
- **Undo/Redo**: Full history management
- **Remove Formatting**: Clean text function

### 🎨 Dark Theme Integration
- **Custom Skin**: Uses TinyMCE's dark skin
- **Zinc Color Palette**: Matches your app design
- **Consistent UI**: Seamless integration with existing components
- **Proper Contrast**: Excellent readability

### 🔧 Technical Features
- **React 19 Compatible**: No deprecated API usage
- **SSR Safe**: Proper dynamic loading
- **Error Handling**: Graceful fallback to textarea
- **Performance Optimized**: Only loads when needed
- **Production Ready**: Comprehensive error boundaries

## Usage

The editor is automatically used for "Portfolio Card" descriptions in the portfolio form:

```typescript
// The component is already integrated in:
// components/portfolio-form-dialog.tsx

<QuillEditor
  value={description}
  onChange={setDescription}
  placeholder="Enter portfolio description"
  height={200}
  disabled={isSubmitting}
/>
```

## Customization

### Toolbar Customization
To modify the toolbar, edit the `toolbar` property in `components/quill-editor.tsx`:

```javascript
toolbar: 'undo redo | blocks | bold italic underline strikethrough | ' +
  'alignleft aligncenter alignright alignjustify | ' +
  'bullist numlist outdent indent | link unlink | removeformat | help'
```

### Plugin Management
Add or remove plugins in the `plugins` array:

```javascript
plugins: [
  'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
  'insertdatetime', 'media', 'table', 'help', 'wordcount'
]
```

### Styling Customization
Modify the `content_style` property to change editor appearance:

```javascript
content_style: `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto';
    font-size: 14px;
    line-height: 1.6;
    color: #ffffff;
    background-color: #09090b;
  }
  // Add more custom styles...
`
```

## Troubleshooting

### Common Issues

1. **Editor Not Loading**:
   - Check browser console for errors
   - Verify internet connection (CDN access needed)
   - Check if component is properly imported

2. **Content Not Saving**:
   - Verify `onChange` handler is connected
   - Check form submission logic
   - Ensure proper state management

3. **Styling Issues**:
   - Check for CSS conflicts
   - Verify dark theme styles are applied
   - Clear browser cache

4. **Production API Key Issues**:
   - Verify environment variable is set correctly
   - Check if API key is valid and active
   - Ensure domain is whitelisted in TinyMCE dashboard

### Fallback Behavior
If TinyMCE fails to load, the component automatically falls back to a styled textarea with proper error messaging.

## Security Considerations

### Content Sanitization
TinyMCE includes built-in XSS protection, but additional sanitization is recommended for user-generated content:

```typescript
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(editorContent);
```

### API Key Security
- API keys are public (NEXT_PUBLIC_*) - this is normal for TinyMCE
- Restrict domains in TinyMCE dashboard for production
- Monitor usage through TinyMCE analytics

## Performance Optimization

### Bundle Size
- Editor loads dynamically (code splitting)
- Only loads when component is used
- CDN delivery for TinyMCE core

### Loading Strategy
- SSR disabled for compatibility
- Graceful loading states
- Error boundaries for resilience

## Support & Updates

### TinyMCE Version
Currently using `@tinymce/tinymce-react@5.1.1` for React 19 compatibility.

### Upgrade Path
When upgrading TinyMCE:
1. Test in development environment
2. Verify React compatibility
3. Check for breaking changes
4. Update documentation

## File Structure

```
components/
├── quill-editor.tsx          # Main TinyMCE component
├── portfolio-form-dialog.tsx # Usage example
└── html-content.tsx          # Content display component

docs/
└── TINYMCE_SETUP.md         # This documentation
```

---

**Note**: This setup provides a production-ready, user-friendly rich text editing experience that's perfect for non-technical users while maintaining robust error handling and performance optimization. 