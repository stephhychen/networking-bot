// import required dependencies 
const express = require("express");
const { OpenAI } = require("openai");
require("dotenv").config();

// employ Express 
const app = express();
app.use(express.json());

// cors enables cross-origin requests (ensures doesn't block JS)
const cors = require('cors');
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// Hardcoded company and team
const CANDIDATE = process.env.CANDIDATE; 
const NAME = process.env.NAME; 

// Uses PerplexityAI to conduct research given name and details about information 
async function dataExtractionEnrichment() {
  // prompt with clear formatting instructions 
  const prompt = `Research 10-20 potential connections given that ${NAME} is ${CANDIDATE}. 
  Format the information into a clear, structured and easily readable summary, focused on why they 
  could be a potential connection for ${NAME}, including details. 

  IMPORTANT: Your response must contain ONLY valid JSON in the exact format below. Do not include any explanatory text, markdown formatting, or other content outside the JSON array.

   [
     {
       "Name": "...",
       "Job Title": "...",
       "Workplace": "...",
       "Strategic Relevance": "...",
       "Previous Mentorship": "...",
       "Contact Information": [
        {
          "Name": "Dan Erickson",
          "Title": "Showrunner for Severance",
          "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/sarah-milton"
        },
        {
          "Name": "Colin Jost",
          "Title": "Head Writer for SNL",
          "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/david-chen"
        }
      ]
     }
   ]
  `; 

  try {
    const response = await client.chat.completions.create({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content || "No formatted response.";
  } catch (error) {
    console.error("API error:", error.message);
    
    // If no API key provided or error, return mock data 
    console.log("Using mock data");
    return JSON.stringify([
      {
        "Name": "...",
        "Job Title": "...",
        "Workplace": "...",
        "Strategic Relevance": "...",
        "Princeton Connection": "...", 
        "Previous Mentorship": "...",
        "Key Contacts": [
         {
           "Name": "Dan Erickson",
           "Title": "Showrunner for Severance",
           "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/sarah-milton"
         },
         {
           "Name": "Colin Jost",
           "Title": "Head Writer for SNL",
           "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/david-chen"
         }
       ]
      },
    ]);
  }
}

// Call to Perplexity AI to generate a personalized LinkedIn outreach message seeking 
// collaboration with our company given the target company and a stakeholder name. 
// Inputs: company (object), contact (object) 
async function generateLinkedinDraft(contact) {
  const prompt = `
    Write a personalized LinkedIn message to ${contact.Name} (${contact.Title}). 
    The message should:
    1. Be professional, funny and concise (under 200 words)
    2. Reference their role and any connection to Princeton or previous experience 
    3. Reference ${NAME}'s experience as ${CANDIDATE}, and make any connections. 
    4. Ask for a brief coffee, call or mentorship possibilities
    5. This is with the end goal of securing a writer's assistant job!
    
    Format as a ready-to-send email. No need for citations or extra justification.
    `;

    try {
      const response = await client.chat.completions.create({
        model: "sonar",
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0]?.message?.content || "No formatted response.";
    } catch (error) {
      console.error("API error:", error.message);
      
      // Template message (in case API doesn't work)
      return `Hi ${contact.Name},

I hope this message finds you well! Please give me a job. I love to write comedy. 

Best regards,
${NAME}`;
    }
}

// extract JSON from API string output 
function extractJsonFromText(text) {
  console.log("Raw API output: ", text); 
  // Find the outermost JSON array (the one with the most content)
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error("No JSON array found in text");
  }
  // let trimmedText = text.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '').trim();
  
  const jsonString = text.substring(startIndex, endIndex + 1);
  return JSON.parse(jsonString); 
}


/* API endpoint for customer data extraction + enrichment using Perplexity */ 
app.get("/api/customers", async (req, res) => {
  try {
    console.log(`Fetching insights for ${NAME}`);
    
    // Parse JSON data from research 
    const result = await dataExtractionEnrichment(); 
    let contactInfo = [];

    contactInfo = extractJsonFromText(result);
    console.log("Extracted JSON: ", contactInfo); 

    console.log(`Successfully retrieved ${contactInfo.length} valid potential customers`);
    res.json({
      contactInfo,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* API endpoint for generating draft messages using Perplexity */ 
app.post("/api/draft-message", async (req, res) => {
  try {
    const { contact } = req.body;
    
    if (!contact) {
      return res.status(400).json({ error: "Contac information required" });
    }

    console.log(`Generating draft message for ${contact.Name}`);
    
    const draftMessage = await generateLinkedinDraft( contact);
    
    res.json({
      message: draftMessage.trim(),
      contact: contact,
    });
  } catch (error) {
    console.error("Error generating draft message:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint -- just making sure that the server is running! 
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running!" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}/api/health`);
});
