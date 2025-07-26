import * as ClipboardExpo from "expo-clipboard";
import { Bot, Send, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const mockResponses: { [key: string]: string } = {
  código:
    'Para consultar el código modular, necesito que me proporciones el nombre completo y apellidos del estudiante. Por ejemplo: "Juan Pérez García"',
  vacaciones:
    "Las vacaciones de verano van del 25 de diciembre al 10 de marzo. Las vacaciones de medio año son del 25 de julio al 8 de agosto.",
  profesor:
    "Puedes contactar a los profesores a través del portal web del colegio o llamando a secretaría al (01) 234-5678 de lunes a viernes de 8:00 AM a 4:00 PM.",
  horarios:
    "Los horarios de clases son: Primaria de 8:00 AM a 1:00 PM, Secundaria de 8:00 AM a 3:00 PM. Los sábados no hay clases regulares.",
  "juan pérez":
    "El código modular de Juan Pérez García es: 12345. Con este código puedes consultar sus pagos en la sección correspondiente.",
  "maría gonzález":
    "El código modular de María González Pérez es: 12345. Con este código puedes consultar sus pagos en la sección correspondiente.",
};

// Función para detectar y renderizar el código modular como texto tocable
const renderBotMessage = (text: string) => {
  // Regex para detectar códigos de 8 a 14 dígitos
  const regex = /(\d{8,14})/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (regex.test(part)) {
      return (
        <Text
          key={idx}
          style={{ color: "#2563eb", fontWeight: "bold" }}
          onPress={async () => {
            await ClipboardExpo.setStringAsync(part);
            Alert.alert("Copiado", "Código copiado al portapapeles");
          }}
        >
          {part}
        </Text>
      );
    }
    return <Text key={idx}>{part}</Text>;
  });
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! Soy el asistente virtual del Colegio Barton. ¿En qué puedo ayudarte hoy?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const [key, response] of Object.entries(mockResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    return "Gracias por tu consulta. Un momento por favor, estoy procesando tu solicitud. Si necesitas ayuda inmediata, puedes llamar a secretaría al (01) 234-5678.";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await fetch(
        "https://barton-mobile-chatbot.onrender.com/chatbot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pregunta: userMessage.text }),
        }
      );
      const data = await response.json();
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text:
          data.respuesta || "No entendí la pregunta o no encontré información.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: "Error de conexión con el servidor.",
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    }
    setIsTyping(false);
  };

  const sendPredefinedQuestion = (question: string) => {
    setInputText(question);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Bot size={28} color="#1E40AF" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Asistente Virtual</Text>
              <Text style={styles.headerSubtitle}>Colegio Barton</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isBot
                  ? styles.botMessageWrapper
                  : styles.userMessageWrapper,
              ]}
            >
              <View style={styles.messageAvatar}>
                {message.isBot ? (
                  <Bot size={20} color="#FFFFFF" />
                ) : (
                  <User size={20} color="#FFFFFF" />
                )}
              </View>
              <View
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botMessage : styles.userMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isBot
                      ? styles.botMessageText
                      : styles.userMessageText,
                  ]}
                >
                  {message.isBot
                    ? renderBotMessage(message.text)
                    : message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.isBot
                      ? styles.botMessageTime
                      : styles.userMessageTime,
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
              <View style={styles.messageAvatar}>
                <Bot size={20} color="#FFFFFF" />
              </View>
              <View style={[styles.messageBubble, styles.botMessage]}>
                <Text style={styles.typingText}>Escribiendo...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe tu consulta..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  botMessageWrapper: {
    justifyContent: "flex-start",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E40AF",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  botMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: "#1E40AF",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: "#1E293B",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  botMessageTime: {
    color: "#64748B",
  },
  userMessageTime: {
    color: "#BFDBFE",
  },
  typingText: {
    fontSize: 16,
    color: "#64748B",
    fontStyle: "italic",
  },
  questionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  questionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
  },
  questionButton: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  questionText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: "#1E40AF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
});
