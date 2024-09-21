import {useEffect, useRef, useState} from 'react';
import './ChatBotApp.css';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const ChatBotApp = ({onEndChat, chats, setChats, activeChat, setActiveChat, onNewChat}) => {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState(chats[0]?.messages || []);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showChatList, setShowChatList] = useState(false);
    const chatEndRef = useRef(null);
    const maxLength = 500; // Set the max_tokens for the API and maxlength of the chat input


    useEffect(() => {
        const activeChatObj = chats.find((chat) => chat.id === activeChat);
        setMessages(activeChatObj ? activeChatObj.messages : []);
    }, [activeChat, chats]);

    useEffect(() => {
        if (activeChat) {
            const storedMessages = JSON.parse(localStorage.getItem(activeChat)) || [];
            setMessages(storedMessages);
        }
    }, [activeChat]);

    const handleEmojiSelect = (emoji) => {
        setInputValue((prevInput) => prevInput + emoji.native); // append the emoji to the input value

    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    }
    const sendMessage = async () => {
        if (inputValue.trim() === '') return

        const newMessage = {
            type: 'prompt',
            text: inputValue,
            timestamp: new Date().toLocaleTimeString(),
        }

        if(!activeChat) {
            onNewChat(inputValue);
            setInputValue('')
        } else {
            const updatedMessages = [...messages, newMessage];
            setMessages(updatedMessages);
            localStorage.setItem(activeChat, JSON.stringify(updatedMessages)); // This ensures that the latest chat is saved in the local storage
            setInputValue('');

            const updatedChats = chats.map((chat) => {
                if (chat.id === activeChat) {
                    return {...chat, messages: updatedMessages};
                }
                return chat;
            })
            setChats(updatedChats);
            localStorage.setItem('chats', JSON.stringify(updatedChats));
            setIsTyping(true);
            const response  = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `${import.meta.env.VITE_OPEN_AI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: inputValue,
                        max_tokens: `${maxLength}`,
                    }],
                })
            })
            const data = await response.json();
            // This extracts the first text content of the AI's response from the API's JSON
            const chatResponse = data.choices[0].message.content.trim();

            const newResponse = {
                type: 'reponse',
                text: chatResponse,
                timestamp: new Date().toLocaleTimeString(),
            }
            const updatedMessagesWithResponse = [...updatedMessages, newResponse]
            setMessages(updatedMessagesWithResponse);
            localStorage.setItem(activeChat, JSON.stringify(updatedMessagesWithResponse));
            setIsTyping(false);

            const updatedChatsWithResponse = chats.map((chat) => {
                if (chat.id === activeChat) {
                    return {...chat, messages: updatedMessagesWithResponse};
                }
                return chat;
            })
            setChats(updatedChatsWithResponse);
            localStorage.setItem('chats', JSON.stringify(updatedChatsWithResponse));
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 13) {
            e.preventDefault();
            sendMessage();
        }
    }

    const handleSelectChat = (id) => {
        setActiveChat(id);
    }
    const handleDeleteChat = (id) => {
        const updatedChats = chats.filter((chat) => chat.id !== id);
        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats)); // This updates the deleted chat in the local storage
        localStorage.removeItem(id); // This ensures that the deleted chat is no longer in the local storage

        if (id === activeChat) {
            const newActiveChat = updatedChats.length > 0 ? updatedChats[0].id : null;
            setActiveChat(newActiveChat);
        }
    }
    // Uses the chatEndRef reference to scroll the chat window to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages])
    return (
        <div className='chat-app'>
            <div className={`chat-list ${showChatList ? 'show' : ''}`}>
                <div className="chat-list__header">
                    <h2>Chats</h2>
                    <i role="button" title="New Chat" className="bx bx-edit-alt new-chat" onClick={() => onNewChat()}></i>
                    <i className="bx bx-x" onClick={() => {setShowChatList(false)}}></i>
                </div>
                <ul className="chat-list__items">
                    {chats.map((chat) => (
                        <li role="button" title="Chat" key={chat.id} className={`chat-list__item ${chat.id === activeChat ? 'active' : ''}`}
                            onClick={() => {handleSelectChat(chat.id); setShowChatList(false)}}>
                            <h4>{chat.displayId}</h4>
                            <i role="button" title="Delete Chat" className="bx bx-x-circle" onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
                            }}></i>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chat-window">
                <div className="chat-title">
                    <h3>Chat with AI</h3>
                    <i className="bx bx-menu" onClick={() => {setShowChatList(true)}}></i>
                    <i role="button" title="End AI Chat" className="bx bx-exit arrow" onClick={onEndChat}></i>
                </div>
                <div className="chat">
                    {messages.map((msg, index) => (
                        <div key={index} className={msg.type === "prompt" ? "prompt" : "response"}>{msg.text}
                            <span>{msg.timestamp}</span>
                        </div>
                    ))}
                    {isTyping && <div className="typing">Typing...</div>}
                    <div ref={chatEndRef}></div>
                </div>
                <form className='msg-form' onSubmit={(e) => e.preventDefault()}>

                    <input
                        type="text"
                        className='msg-input'
                        placeholder='Message...'
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        maxLength={maxLength}
                        onFocus={() => setShowEmojiPicker(false)}
                    />
                    <i
                        role="button"
                        title="Add Emojis"
                        className="fa-solid fa-face-smile emoji"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}>
                    </i>
                    {showEmojiPicker && (
                        <div className="emoji-picker">
                            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                        </div>
                    )}
                    <i role="button" title="Send" className="fa-solid fa-paper-plane" onClick={sendMessage}></i>
                </form>
            </div>
        </div>
    );
};

export default ChatBotApp;
