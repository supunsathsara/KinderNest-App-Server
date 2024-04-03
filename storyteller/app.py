from flask import Flask, request, render_template, jsonify
import os
from groq import Groq
from langchain.chains import ConversationChain
from langchain.chains.conversation.memory import ConversationBufferWindowMemory
from langchain_groq import ChatGroq
import pyttsx3
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

engine = pyttsx3.init()

@app.route('/', methods=['GET', 'POST'])
def main():
    story = ''
    groq_api_key = os.environ['GROQ_API_KEY']
    model = 'mixtral-8x7b-32768'
    conversational_memory_length = 5

    memory = ConversationBufferWindowMemory(k=conversational_memory_length)
    groq_chat = ChatGroq(groq_api_key=groq_api_key, model_name=model)
    conversation = ConversationChain(llm=groq_chat, memory=memory)

    if request.method == 'POST':
        keyword = request.form['keyword']
        if keyword:
            user_question = f"i'm a 5 years old child, give me a fairy tale about {keyword}, only give me the tale"
            response = conversation(user_question)
            story = response['response']

    return render_template('index.html', story=story)

@app.route('/generate', methods=['GET', 'POST'])
def generate_story():
    if request.method == 'POST':
        # Initialize variables and the conversation chain
        groq_api_key = os.environ['GROQ_API_KEY']
        model = 'mixtral-8x7b-32768'
        conversational_memory_length = 5

        memory = ConversationBufferWindowMemory(k=conversational_memory_length)
        groq_chat = ChatGroq(groq_api_key=groq_api_key, model_name=model)
        conversation = ConversationChain(llm=groq_chat, memory=memory)

        # Process the keyword from the request to generate a story
        keyword = request.json.get('keyword')  # Assuming JSON input
        if keyword:
            user_question = f"i'm a 5 years old child, give me a fairy tale about {keyword}, only give me the tale"
            response = conversation(user_question)
            story = response['response']
            return jsonify({"story": story})
        else:
            return jsonify({"error": "Keyword is required."}), 400

    # For GET requests or unsupported methods
    return jsonify({"message": "Please send a POST request with a keyword to generate a story."}), 405

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))  # Default to 5000 if PORT is not set
    app.run(debug=True, port=port)
