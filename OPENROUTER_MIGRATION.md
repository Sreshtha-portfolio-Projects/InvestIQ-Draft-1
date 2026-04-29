# Migration from Gemini to OpenRouter

## ✅ Completed Changes

### Backend Changes
1. **Created new AI client** (`backend/src/ai/aiClient.ts`)
   - Replaced Google Generative AI SDK with OpenRouter REST API
   - Uses axios for HTTP requests (already in dependencies)
   - Supports any model available on OpenRouter
   - Default model: `google/gemini-flash-1.5-8b` (fast & cheap)

2. **Updated all AI services**
   - `researchAssistant.ts`: Now uses `aiClient` instead of `geminiClient`
   - `screenerInterpreter.ts`: Now uses `aiClient` instead of `geminiClient`
   - `earningsAnalyzer.ts`: Now uses `aiClient` instead of `geminiClient`

3. **Updated error handling**
   - Detects OpenRouter-specific errors (401, 404, 429, etc.)
   - Clear error messages for API key, model, and quota issues
   - Sanitizes API keys in error logs

4. **Updated environment variables**
   - `GEMINI_API_KEY` → `OPENROUTER_API_KEY`
   - `GEMINI_MODEL` → `AI_MODEL`
   - Updated `.env.example` with OpenRouter instructions

5. **Removed Gemini dependency**
   - Removed `@google/generative-ai` from `package.json`
   - Deleted `geminiClient.ts`

### Documentation Changes
1. **README.md**: Updated all references to OpenRouter
2. **backend/.env.example**: Updated with OpenRouter key instructions
3. Created this migration guide

## 🎯 How to Use

### 1. Get an OpenRouter API Key
1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Click "Create Key"
4. Copy the key (starts with `sk-or-v1-...`)

### 2. Update Your Environment
Edit `backend/.env`:
```env
# Replace this:
GEMINI_API_KEY=AIzaSy...

# With this:
OPENROUTER_API_KEY=sk-or-v1-...
```

### 3. (Optional) Choose a Different Model
OpenRouter supports many models. See [openrouter.ai/models](https://openrouter.ai/models) for the full list.

Edit `backend/.env` to add:
```env
AI_MODEL=anthropic/claude-3-haiku
# or
AI_MODEL=meta-llama/llama-3.1-70b-instruct
# or
AI_MODEL=google/gemini-pro-1.5
```

If not set, defaults to `google/gemini-flash-1.5-8b`.

### 4. Restart Backend
```bash
cd backend
npm run dev
```

That's it! All AI features (research, screener, earnings) now use OpenRouter.

## 💰 Pricing

OpenRouter is pay-as-you-go with competitive pricing:
- **Gemini Flash 1.5 8B**: ~$0.075 per 1M tokens
- **Claude 3 Haiku**: ~$0.25 per 1M tokens
- **GPT-4o Mini**: ~$0.15 per 1M tokens

Most requests cost < $0.01 per query.

## 🔄 Rollback (if needed)

If you need to go back to Gemini:
1. Restore `geminiClient.ts` from git history
2. Update imports in AI service files
3. Add `@google/generative-ai` back to package.json
4. Revert environment variable names
5. Restart backend

## ✨ Benefits

1. **More Models**: Access to 100+ models from multiple providers
2. **No API Key Expiration**: OpenRouter keys don't expire
3. **Better Pricing**: Pay-as-you-go, often cheaper than direct APIs
4. **Automatic Fallbacks**: OpenRouter can auto-fallback if a model is down
5. **Usage Analytics**: Built-in dashboard at openrouter.ai

## 📝 Notes

- The AI prompts and response parsing remain unchanged
- JSON response format is identical
- No frontend changes required
- No database schema changes required
