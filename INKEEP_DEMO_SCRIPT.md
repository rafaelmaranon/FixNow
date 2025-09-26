# 🤖 Inkeep Agent Framework Demo Script

## **"How We're Using Inkeep AI Agents"** (2-3 minutes)

### **1. Show the Branding (30 seconds)**
- **Point to header**: "Powered by Inkeep Agent Framework"
- **Point to pulsing badge**: "3 AI Agents Active" 
- **Click the 🤖 chat button**: "This connects to our multi-agent system"

### **2. Demonstrate the 3-Agent Architecture (1 minute)**
**Open the AI chat and show these interactions:**

**Chat Message 1**: "Show me emergency jobs"
- **Agent Response**: Dispatcher Agent analyzes urgent jobs
- **Explain**: "This is our main Dispatcher Agent coordinating everything"

**Chat Message 2**: "Optimize contractor routes"  
- **Agent Response**: Scheduler Agent provides route optimization
- **Explain**: "Now the Scheduler Agent is handling logistics optimization"

**Chat Message 3**: "Which contractors are available?"
- **Agent Response**: Contractor Manager Agent lists available contractors
- **Explain**: "The Contractor Manager Agent tracks all our resources"

### **3. Show Real Inkeep Integration (1 minute)**
**Open terminal and demonstrate:**

```bash
# Show the actual Inkeep project structure
cd /Users/rafaelmaranon/my-agent-directory/src/contractor-dispatcher-mvp/
ls -la

# Show the agent configuration
cat graphs/contractor-dispatcher.ts

# Test the agents directly (if time allows)
inkeep chat --project contractor-dispatcher-mvp
```

### **4. Key Talking Points**
- **"We built a 3-agent system using Inkeep's framework"**
- **"Dispatcher Agent coordinates, Scheduler optimizes, Manager tracks resources"**
- **"Each agent has specialized knowledge and can delegate to others"**
- **"The chat interface shows real AI decision-making in action"**
- **"This demonstrates production-ready AI agent orchestration"**

---

## **Quick Inkeep Commands for Live Demo**

### **Test the Backend Agents**
```bash
# Navigate to project
cd /Users/rafaelmaranon/my-agent-directory

# Start Inkeep services (if not running)
pnpm dev:apis

# Test the agents directly
inkeep chat --project contractor-dispatcher-mvp
```

### **Show Agent Configuration**
```bash
# Show the agent definitions
cat src/contractor-dispatcher-mvp/graphs/contractor-dispatcher.ts

# Show project structure
cat src/contractor-dispatcher-mvp/index.ts
```

### **Demonstrate Agent Responses**
**Try these prompts in the chat:**
- "I need to assign a plumber to an emergency job"
- "What's the most efficient route for today's jobs?"
- "Which contractors have the highest ratings?"
- "How should I prioritize these 20 jobs?"

---

## **Judge Questions & Answers**

**Q: "How are you using AI differently?"**
**A:** "We're using Inkeep's multi-agent framework where each agent has specialized expertise. The Dispatcher coordinates, the Scheduler optimizes routes, and the Manager tracks contractor availability. They work together like a real dispatch team."

**Q: "Is this just ChatGPT?"**
**A:** "No, this is Inkeep's specialized agent framework. Each agent has specific prompts, can delegate to other agents, and maintains context about contractor operations. It's designed for enterprise workflows, not general chat."

**Q: "How does the agent coordination work?"**
**A:** "The agents use Inkeep's delegation system. The main Dispatcher can call the Scheduler for route optimization or the Contractor Manager for resource allocation. Each agent maintains its own expertise domain."

**Q: "Can you show the actual agent code?"**
**A:** [Show the contractor-dispatcher.ts file with the 3 agent definitions and their specialized prompts]

---

## **Technical Proof Points**

✅ **Real Inkeep Project**: `contractor-dispatcher-mvp` in the framework  
✅ **3 Specialized Agents**: Dispatcher, Scheduler, Contractor Manager  
✅ **Agent Delegation**: Each agent can call others using `canDelegateTo`  
✅ **Production Integration**: Chat interface connects to real agent responses  
✅ **Enterprise Framework**: Built on Inkeep's agent orchestration platform  

This demonstrates **real AI agent architecture**, not just a chatbot wrapper!
