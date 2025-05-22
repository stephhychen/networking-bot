// import required dependencies 
const express = require("express");
const { OpenAI } = require("openai");
require("dotenv").config();

// 
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
const COMPANY = process.env.COMPANY; 
const TEAM = process.env.TEAM; 

// 1. Use Perplexity to research customers with ICP 
async function dataExtractionEnrichment() {
  // prompt with clear formatting instructions 
  const prompt = `
  Research ${COMPANY}'s ${TEAM} business segment. 
  1. Find existing customers. 
  2. Identify major trade associations, industry events, or professional bodies that these types of customers attend or belong to.
  3. Find 10 companies that attended these events. They should not be current customers of ${COMPANY}. For the companies, research estimated:
  - Revenue
  - Employee count
  - Website
  - Industry
  4. Sort by revenue, tie-breaking by employee count. 
  5. Format the company information into clear, structured, and easily readable summary, focused on why they
  could be a potential new customer for ${COMPANY} ${TEAM}, including details. 
  6. Find 1–2 key decision-makers** (e.g., VP, Director, Head of relevant team). Include their name, title, and if available, LinkedIn Sales Navigator URL. 

  IMPORTANT: Your response must contain ONLY valid JSON in the exact format below. Do not include any explanatory text, markdown formatting, or other content outside the JSON array.

   [
     {
       "Name": "...",
       "Industry Fit": "...",
       "Size and Revenue": ...,
       "Strategic Relevance": "...",
       "Industry Engagement": "...", 
       "Market Activity": "...",
       "Key Contacts": [
        {
          "Name": "Sarah Milton",
          "Title": "VP of Procurement",
          "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/sarah-milton"
        },
        {
          "Name": "David Chen",
          "Title": "Director of Marketing",
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
        "Name": "SignWorks Inc.",
        "Industry Fit": "Signage Manufacturing",
        "Size and Revenue": "$45M annual revenue, 250 employees",
        "Strategic Relevance": "Uses vinyl materials for outdoor signage",
        "Industry Engagement": "Member of ISA (International Sign Association)",
        "Market Activity": "Recently expanded production capacity by 30%",
        "Key Contacts": [
          {
            "Name": "Sarah Milton",
            "Title": "VP of Procurement",
            "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/sarah-milton"
          },
          {
            "Name": "David Chen",
            "Title": "Director of Marketing",
            "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/david-chen"
          }
        ],
      },
      {
        "Name": "GraphicPro Displays",
        "Industry Fit": "Commercial Display Production",
        "Size and Revenue": "$32M annual revenue, 180 employees",
        "Strategic Relevance": "Specializes in weather-resistant displays",
        "Industry Engagement": "Regular exhibitor at PRINTING United",
        "Market Activity": "Launched new line of UV-resistant materials",
        "Key Contacts": [
          {
            "Name": "Sarah Milton",
            "Title": "VP of Procurement",
            "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/sarah-milton"
          },
          {
            "Name": "David Chen",
            "Title": "Director of Marketing",
            "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/david-chen"
          }
        ],
      },
      {
        "Name": "Outdoor Media Solutions",
        "Industry Fit": "Outdoor Advertising",
        "Size and Revenue": "$28M annual revenue, 140 employees",
        "Strategic Relevance": "Needs durable materials for billboards",
        "Industry Engagement": "Member of OAAA (Outdoor Advertising Association)",
        "Market Activity": "Expanding into digital/traditional hybrid displays",
        "Key Contacts": [
          {
            "Name": "Sarah Milton",
            "Title": "VP of Procurement",
            "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/sarah-milton"
          },
          {
            "Name": "David Chen",
            "Title": "Director of Marketing",
            "LinkedIn SalesNav URL": "https://www.linkedin.com/sales/people/david-chen"
          }
        ],
      }
    ]);
  }
}

// Call to Perplexity AI to generate a personalized LinkedIn outreach message seeking 
// collaboration with our company given the target company and a stakeholder name. 
// Inputs: company (object), contact (object) 
async function generateLinkedinDraft(company, contact) {
  const prompt = `
    Write a personalized LinkedIn message to ${contact.Name} (${contact.Title}) at ${company}. 
    The message should:
    1. Be professional and concise (under 200 words)
    2. Reference their role at ${company}
    3. Propose potential collaboration with ${COMPANY} in the ${TEAM} segment
    4. Justify why the collaboration would work well
    5. Include a clear call-to-action for a brief conversation
    6. Be friendly but not overly familiar
    
    Format as a ready-to-send LinkedIn message. No need for citations or extra justification.
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

I hope this message finds you well. I noticed your role as ${contact.Title} at ${company}, and I'm impressed by the work your team is doing.

I'm reaching out from ${COMPANY}, where we specialize in ${TEAM} solutions. Given ${company}'s focus and growth trajectory, I believe there might be some interesting synergies between our organizations.

Would you be open to a brief 15-minute conversation to explore potential collaboration opportunities? I'd love to learn more about your current priorities and share some insights from our work with similar companies.

Looking forward to hearing from you.

Best regards,
[Your Name]`;
    }
}

// extract JSON from API string output 
function extractJsonFromText(text) {
  // console.log("Raw API output: ", text); 
  // Find the outermost JSON array (the one with the most content)
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error("No JSON array found in text");
  }
  
  const jsonString = text.substring(startIndex, endIndex + 1);
  return JSON.parse(jsonString); 
}


/* API endpoint for customer data extraction + enrichment using Perplexity */ 
app.get("/api/customers", async (req, res) => {
  try {
    console.log(`Fetching insights for ${COMPANY}, ${TEAM} team...`);
    
    // Parse JSON data from research 
    const result = await dataExtractionEnrichment(); 
    let companyInfo = [];

    companyInfo = extractJsonFromText(result);
    // console.log("Extracted JSON: ", companyInfo); 

    console.log(`Successfully retrieved ${companyInfo.length} valid potential customers`);
    res.json({
      company: COMPANY,
      segment: TEAM,
      companyInfo,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* API endpoint for generating draft messages using Perplexity */ 
app.post("/api/draft-message", async (req, res) => {
  try {
    const { contact, company } = req.body;
    
    if (!contact || !company) {
      return res.status(400).json({ error: "Contact and company information required" });
    }

    console.log(`Generating draft message for ${contact.Name} at ${company}...`);
    
    const draftMessage = await generateLinkedinDraft(company, contact);
    
    res.json({
      message: draftMessage.trim(),
      contact: contact,
      company: company
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
