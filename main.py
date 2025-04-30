from flask import Flask, render_template, jsonify, request
import pandas as pd
import requests
from langchain_together import Together

app = Flask(__name__)

# Together AI API configuration
TOGETHER_API_KEY = "tgp_v1_49vWGNGcLixzfeMiS8GQNCKg5MH4Wo0sprjba0xhjjE"
API_URL = "https://api.together.xyz/v1/chat/completions"

# Initialize the Together AI model
def initialize_llm():
   return Together(
        model="mistralai/Mistral-7B-Instruct-v0.2",
        together_api_key="tgp_v1_49vWGNGcLixzfeMiS8GQNCKg5MH4Wo0sprjba0xhjjE",
        max_tokens=30000
    )

# Function to clean the output from Together AI
def get_cleaned_output(prompt, llm):
    result = llm.invoke(prompt)
    # Split by lines, remove the first 2 lines, and join the rest
    cleaned_result = "\n".join(result.splitlines()[3:])
    return cleaned_result

@app.route("/")
def hello_world():
    return render_template('index.html')

@app.route("/get_analysis", methods=["POST"])
def get_analysis():
    try:
        feature = request.json.get('feature')
        
        # Read the CSV file
        try:
            df = pd.read_csv("AdaniGreen.csv", usecols=[0, 1])
            article_text = df
        except FileNotFoundError:
            article_text = "Sample financial data for demonstration"
            
        llm = initialize_llm()


        # Generate different prompts based on the requested feature
        if feature == 'dataAnalysis':
            prompt = f"""Analyze the financial data provided and generate a detailed analysis, focusing on trends, patterns, and key financial insights without explicitly describing the given values. Additionally, forecast 'Your Company's' future financial performance by identifying trends, patterns, and key indicators to predict potential growth, profitability, and market position. Consider historical performance, industry benchmarks, and economic factors while making data-driven projections. Conclude with a concise evaluation of 'Your Company's' financial health and expected trajectory, replacing 'the company' with 'Your Company' in the summary. Ensure the analysis is insightful, forward-looking, and based on clear data-driven reasoning. :  {article_text}"""
        if feature == 'budgeting':
            prompt = f"""Analyze the financial data provided and generate a detailed budgeting report for 'Your Company.' Identify key revenue streams, fixed and variable costs, operational expenses, and profitability margins. Assess cash flow trends, cost efficiency, and potential areas for financial optimization. Provide a breakdown of expected expenditures, investment allocations, and projected savings. Conclude with a concise evaluation of 'Your Company's' financial planning, ensuring sustainable growth and stability. Replace 'the company' with 'Your Company' in the summary. Use data-driven insights and industry benchmarks to support the analysis.Write in 150 words: {article_text}"""
        if feature == 'expenseManagement':
            prompt = f"""Analyze the financial data provided and generate a detailed expense management report for 'Your Company.' Identify key fixed and variable costs, operational expenses, and cash flow trends. Assess cost efficiency, highlight areas of excessive spending, and suggest strategies for optimization. Provide insights into budgeting, cost-cutting opportunities, and resource allocation to enhance profitability. Conclude with a concise evaluation of 'Your Company's' expense management strategy, ensuring financial stability and long-term sustainability. Replace 'the company' with 'Your Company' in the summary. Use data-driven insights and industry benchmarks to support the analysis.Write in 150 words: {article_text}"""
        if feature == 'investment':
            prompt = f"""Based on the financial data provided, recommend investment strategies for 'Your Company'. Suggest potential areas for capital allocation, growth opportunities, and risk management considerations. Include both short-term and long-term investment perspectives in your recommendations. Write in a clear, professional manner with actionable advice in about 150 words:  {article_text}"""

        result = get_cleaned_output(prompt, llm)
        return jsonify({"success": True, "result": result})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    
@app.route('/chatbot_page')
def chatbot_page():
    return render_template('chatbot.html')

@app.route('/chatbot', methods=['POST'])
def chatbot():
    try:
        data = request.json
        user_message = data.get('message', '').strip().lower()
        
        # If it's just a greeting, respond appropriately
        if user_message in ['hi', 'hello', 'hey']:
            return jsonify({
                "response": "Hello! I'm your financial AI assistant. How can I help you with financial analysis today?"
            })
            
        # Load financial context if available
        financial_context = ""
        try:
            df = pd.read_csv("AdaniGreen.csv", usecols=[0, 1])
            financial_context = f"Here's the financial data context: {str(df)}"
        except Exception as e:
            print(f"Error loading financial data: {str(e)}")
        
        # Prepare the system prompt
        system_prompt = """You are a financial AI assistant for a company dashboard. Provide:
        1. Focus on practical financial advice
        2. Only provide financial summaries when explicitly asked
        3. For greetings, keep it simple
        4. Ask clarifying questions if the request is vague
        5. Do not give the analysis which are already asked for.
        6. Do not give the values from the csv file in this response.
        7. Give the answer with Markdowns"""
        
        if financial_context:
            system_prompt += f"\n\nContext: {financial_context}"
        
        headers = {
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistralai/Mistral-7B-Instruct-v0.2",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }
        
        response = requests.post(API_URL, json=payload, headers=headers)
        
        if response.status_code == 200:
            # Clean the response
            bot_response = response.json()["choices"][0]["message"]["content"]
            if "Assistant:" in bot_response:
                bot_response = bot_response.split("Assistant:")[-1].strip()
            return jsonify({"response": bot_response})
        else:
            return jsonify({
                "response": "I apologize, but I'm having trouble processing your request. Please try again later."
            })
    
    except Exception as e:
        print(f"Chatbot error: {str(e)}")
        return jsonify({
            "response": "I encountered an error while processing your message. Please try again."
        })

if __name__ == "__main__":
    app.run(debug=True)