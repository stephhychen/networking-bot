# 🧠 Lead Generation and Outreach – Prototype

Given a target company and department, this prototype finds companies that might fit the target company's ideal customer profile (ICP) by 
identifying events current customer companies have attended, and finding companies that have attended the same events. 

<img width="1195" alt="Screenshot 2025-05-21 at 10 39 45 PM" src="https://github.com/user-attachments/assets/e0514361-447c-454e-b684-415e99b78b1b" />

> The landing page of the companies researched for DuPont Tedlar's Graphics and Signage Division.

The prototype also locates key stakeholders (leads) in the potential customer companies, and drafts personalized LinkedIn outreach messages. 

(This feature is yet to be fully fleshed out -- a viable next step is integrating LinkedIn Sales Navigator API to more accurately locate company stakeholders 
and their LinkedIn information. Oftentimes, the API used in this demo doesn't accurately locate the contact information, and so hallucinates the LinkedIn profile.) 

---

## 🔐 Environment Configuration

> **Note:** The `.env` file is excluded from the repository because it contains sensitive information like the Perplexity API key.

Create a `.env` file in the root directory with the following values:

- `PERPLEXITY_API_KEY=your_perplexity_api_key`
- `COMPANY="DuPont Tedlar"`
- `TEAM="Graphics and Signage"`

Replace `your_perplexity_api_key` with your actual key from Perplexity and update `COMPANY` and `TEAM` as needed for your use case. 

---

## 🚀 Deployment Instructions

1. Run 'npm install' in the terminal to install all dependencies (listed in package.json).
2. Run 'npm run dev' in the terminal to deploy both frontend and backend.
3. Open 'http://localhost:3000' (should also automatically open after 'npm run dev')

