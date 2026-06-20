from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.list_sessions, name='list_sessions'),
    path('sessions/<uuid:session_id>/messages/', views.get_session_messages, name='get_session_messages'),
    path('sessions/<uuid:session_id>/', views.delete_session, name='delete_session'),
    path('chat/', views.send_chat_message, name='send_chat_message'),
]
