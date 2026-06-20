from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import ChatSession, Message
from .services import generate_startup_guidance
import json

@api_view(['GET'])
def list_sessions(request):
    sessions = ChatSession.objects.all()
    data = []
    for s in sessions:
        # Get the first user message as preview if title is default
        title = s.title
        data.append({
            "id": str(s.id),
            "title": title,
            "created_at": s.created_at.isoformat()
        })
    return Response(data)

@api_view(['GET'])
def get_session_messages(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id)
    messages = session.messages.all()
    data = []
    for m in messages:
        # Parse metadata JSON back into object if it exists
        metadata_obj = None
        if m.metadata:
            try:
                metadata_obj = json.loads(m.metadata)
            except Exception:
                metadata_obj = m.metadata
                
        data.append({
            "id": str(m.id),
            "sender": m.sender,
            "content": m.content,
            "metadata": metadata_obj,
            "timestamp": m.timestamp.isoformat()
        })
    return Response(data)

@api_view(['DELETE'])
def delete_session(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id)
    session.delete()
    return Response({"status": "deleted"}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def send_chat_message(request):
    session_id = request.data.get('session_id')
    prompt = request.data.get('prompt')
    
    if not prompt:
        return Response({"error": "Prompt is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Get user API Key from header if provided
    api_key = request.headers.get('X-Gemini-Key')
    if api_key == 'null' or api_key == 'undefined':
        api_key = None
        
    # Get or create session
    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            session = ChatSession.objects.create()
    else:
        session = ChatSession.objects.create()
        
    # Save User message
    user_msg = Message.objects.create(
        session=session,
        sender='user',
        content=prompt
    )
    
    # Retrieve last 10 messages for conversation context
    past_messages = session.messages.all().exclude(id=user_msg.id)[:10]
    history_list = []
    for msg in past_messages:
        history_list.append({
            "sender": msg.sender,
            "content": msg.content
        })
        
    # Generate bot response using our service
    bot_content, bot_metadata = generate_startup_guidance(prompt, api_key=api_key, history=history_list)
    
    # Save Bot message
    bot_msg = Message.objects.create(
        session=session,
        sender='bot',
        content=bot_content,
        metadata=bot_metadata
    )
    
    # Update Session Title if it was default
    if session.title == "New Startup Discussion":
        # Make the title from the prompt or from the generated idea title
        title_to_set = "Discussion"
        if bot_metadata:
            try:
                meta = json.loads(bot_metadata)
                title_to_set = meta.get('title', prompt[:30])
            except Exception:
                title_to_set = prompt[:30]
        else:
            title_to_set = prompt[:30]
            
        session.title = title_to_set
        session.save()
        
    # Return response
    parsed_metadata = None
    if bot_msg.metadata:
        try:
            parsed_metadata = json.loads(bot_msg.metadata)
        except Exception:
            parsed_metadata = bot_msg.metadata
            
    return Response({
        "session_id": str(session.id),
        "session_title": session.title,
        "message": {
            "id": str(bot_msg.id),
            "sender": bot_msg.sender,
            "content": bot_msg.content,
            "metadata": parsed_metadata,
            "timestamp": bot_msg.timestamp.isoformat()
        }
    })
