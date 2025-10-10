# Career Tools Setup Guide

Quick setup guide for the Career Tools feature on the `feature/career-tools` branch.

## Prerequisites

1. ✅ Backend and frontend already set up
2. ✅ PostgreSQL database running
3. ✅ OpenAI API key (required for AI features)
4. ✅ Node.js and npm installed

## Backend Setup

### 1. Update Environment Variables

Add to `backend/.env`:

```env
# Existing variables...
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ustbian
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# AI Features (Add this)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Install Dependencies (if needed)

The OpenAI package should already be installed, but if not:

```bash
cd backend
npm install openai
```

### 3. Database Migrations

The TypeORM entities will auto-create tables if `synchronize: true` in development:

Tables created:
- `resumes`
- `cover_letters`
- `job_applications`

For production, you should create proper migrations:

```bash
npm run migration:generate -- -n AddCareerTables
npm run migration:run
```

### 4. Start Backend

```bash
cd backend
npm run start:dev
```

Check console for:
```
[AIService] OpenAI service initialized successfully
```

## Frontend Setup

### 1. Environment Variables

Create `web/.env.local` (if not exists):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 2. Start Frontend

```bash
cd web
npm run dev
```

## Testing the Feature

### 1. Access Career Center

1. Navigate to the app: `http://localhost:3001` (or your port)
2. Login or register
3. Click on profile menu (top right)
4. Click "Career Center"

### 2. Create a Resume

1. Click "Create Resume" or "+ New Resume"
2. Go through the multi-step form
3. Try the "AI Generate" button on the basic info step
4. Fill in details and click through steps
5. Preview and save

### 3. Optimize Resume

1. From dashboard, click "Optimize Resume"
2. Select the resume you created
3. Optionally add target role or job description
4. Click "Optimize Resume"
5. Review AI suggestions and score

### 4. Generate Cover Letter

1. From dashboard, click "Generate Cover Letter"
2. Fill in job details (title, company, description)
3. Enter your name
4. Optionally link the resume you created
5. Add customization details
6. Click "Generate Cover Letter"
7. Review, edit, and save

### 5. Export Documents

1. Open any resume or cover letter detail page
2. Click "Export PDF"
3. Use browser print dialog to save as PDF

## Verification Checklist

- [ ] Backend starts without errors
- [ ] OpenAI service initializes successfully
- [ ] Career Center link appears in navigation
- [ ] Dashboard loads with stats (even if all zeros)
- [ ] Can create a resume through multi-step form
- [ ] AI Generate button works (creates summary/skills)
- [ ] Can optimize resume and see suggestions
- [ ] Can generate cover letter with AI
- [ ] Can view resume detail page
- [ ] Can view cover letter detail page
- [ ] Export PDF functionality works
- [ ] Can delete resumes and cover letters
- [ ] Navigation works correctly
- [ ] UI looks good and responsive

## Common Issues

### "AI service is not configured"
**Solution**: Check that `OPENAI_API_KEY` is set in `backend/.env` and restart backend

### "Failed to generate text"
**Solutions**:
- Verify OpenAI API key is valid
- Check OpenAI account has credits
- Check internet connection
- Check OpenAI API status

### Tables not created
**Solutions**:
- Ensure `synchronize: true` in development mode
- Manually run migrations
- Check database connection settings

### Navigation link not appearing
**Solution**: Clear browser cache and refresh

### Export not working
**Solutions**:
- Try different browser
- Allow pop-ups
- Check browser print settings

## API Endpoints

All career endpoints are under `/career`:

### Dashboard
- `GET /career/stats`

### Resumes
- `GET /career/resumes`
- `GET /career/resumes/:id`
- `POST /career/resumes`
- `PUT /career/resumes/:id`
- `DELETE /career/resumes/:id`
- `POST /career/resumes/generate`
- `POST /career/resumes/optimize`

### Cover Letters
- `GET /career/cover-letters`
- `GET /career/cover-letters/:id`
- `POST /career/cover-letters`
- `PUT /career/cover-letters/:id`
- `DELETE /career/cover-letters/:id`
- `POST /career/cover-letters/generate`

## Database Schema

### Resumes Table

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  location VARCHAR,
  website VARCHAR,
  linkedin VARCHAR,
  github VARCHAR,
  summary TEXT,
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  projects JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  optimization_score INT DEFAULT 0,
  suggestions JSONB,
  template VARCHAR DEFAULT 'modern',
  accent_color VARCHAR DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Cover Letters Table

```sql
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  job_title VARCHAR NOT NULL,
  company VARCHAR NOT NULL,
  job_description TEXT,
  content TEXT NOT NULL,
  sender_name VARCHAR NOT NULL,
  sender_email VARCHAR NOT NULL,
  sender_phone VARCHAR,
  sender_address VARCHAR,
  recipient_name VARCHAR,
  recipient_title VARCHAR,
  company_address VARCHAR,
  date_written DATE,
  tone VARCHAR DEFAULT 'professional',
  key_points JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Job Applications Table

```sql
CREATE TABLE job_applications (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  resume_id UUID,
  cover_letter_id UUID,
  job_title VARCHAR NOT NULL,
  company VARCHAR NOT NULL,
  job_url VARCHAR,
  job_description TEXT,
  location VARCHAR,
  salary VARCHAR,
  status VARCHAR DEFAULT 'draft',
  applied_date DATE,
  deadline_date DATE,
  notes TEXT,
  timeline JSONB DEFAULT '[]',
  contacts JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Next Steps

1. Test all functionality thoroughly
2. Get user feedback
3. Monitor AI API costs
4. Consider adding more templates
5. Add job application tracking
6. Enhance export with PDF libraries

## Cost Considerations

### OpenAI API Costs (GPT-4o-mini)

Approximate costs per operation:
- Resume generation: ~3-5 cents
- Resume optimization: ~3-5 cents  
- Cover letter generation: ~2-3 cents

For 1000 operations: ~$30-50

Monitor usage at: https://platform.openai.com/usage

## Support

If you encounter issues:

1. Check this guide
2. Review backend logs
3. Check browser console
4. Verify environment variables
5. Test API endpoints with Postman
6. Check database tables exist

## Deployment Notes

### Environment Variables (Production)

Ensure these are set in production:

```env
NODE_ENV=production
OPENAI_API_KEY=sk-prod-...
DB_HOST=production-db-host
# ... other production settings
```

### Database

- Use migrations instead of synchronize
- Back up data regularly
- Monitor performance
- Index frequently queried fields

### Security

- Validate all user inputs
- Rate limit AI endpoints
- Monitor API costs
- Secure environment variables

---

**Setup complete! 🚀**

Your Career Tools feature should now be fully functional. Test thoroughly and enjoy!

