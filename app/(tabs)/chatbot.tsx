import * as ClipboardExpo from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Bot,
  Send,
  User,
  Paperclip,
  Camera,
  FileText,
  X,
  Plus,
} from "lucide-react-native";
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
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../../config/api";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: Array<{ texto: string; valor: string }>;
  tipo?: string;
}

interface ChatbotResponse {
  mensaje: string;
  opciones?: Array<{ texto: string; valor: string }>;
  tipo?: string;
  session_id?: string;
  documentos_recibidos?: number;
}

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  mimeType?: string;
}

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
      text: "¡Hola! 👋 Soy el Asistente Virtual del I.E.P. Barton. Me alegra saludarte. ¿En qué puedo ayudarte hoy? Puedo asistirte con información sobre matrículas, requisitos, pagos y más.",
      isBot: true,
      timestamp: new Date(),
      options: [
        { texto: "📚 Información de Matrícula", valor: "matricula" },
        { texto: "📋 Ver Requisitos", valor: "requisitos" },
        { texto: "💰 Consultar Pagos", valor: "pagos" },
        { texto: "📞 Hablar con Asesor", valor: "asesor" },
      ],
      tipo: "opciones",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  // Crear sesión al iniciar
  useEffect(() => {
    crearNuevaSesion();
  }, []);

  const crearNuevaSesion = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.NUEVA_SESION}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setIsConnected(true);
        console.log("Nueva sesión creada:", data.session_id);
      } else {
        console.error("Error al crear sesión:", response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error al crear sesión:", error);
      setIsConnected(false);
    }
  };

  const iniciarNuevoChat = () => {
    // Limpiar mensajes y crear nueva sesión
    setMessages([
      {
        id: "1",
        text: "¡Hola! 👋 Soy el Asistente Virtual del I.E.P. Barton. Me alegra saludarte. ¿En qué puedo ayudarte hoy? Puedo asistirte con información sobre matrículas, requisitos, pagos y más.",
        isBot: true,
        timestamp: new Date(),
        options: [
          { texto: "📚 Información de Matrícula", valor: "matricula" },
          { texto: "📋 Ver Requisitos", valor: "requisitos" },
          { texto: "💰 Consultar Pagos", valor: "pagos" },
          { texto: "📞 Hablar con Asesor", valor: "asesor" },
        ],
        tipo: "opciones",
      },
    ]);
    setInputText("");
    setSelectedFiles([]);
    setSessionId(null);
    crearNuevaSesion();
  };

  const sendMessage = async (
    text: string,
    archivos?: Array<{ tipo: string; nombre: string; contenido: string }>
  ) => {
    if (!text.trim() && !selectedFiles.length && !archivos) return;

    setIsTyping(true);
    const messageText = text.trim();

    // Crear mensaje del usuario que incluya texto e imágenes
    let userMessageText = messageText;
    if (selectedFiles.length > 0) {
      const imageText = selectedFiles
        .map((file) => `📎 ${file.name}`)
        .join(", ");
      userMessageText = messageText
        ? `${messageText}\n${imageText}`
        : imageText;
    }

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Limpiar input y archivos seleccionados inmediatamente
    setInputText("");
    setSelectedFiles([]);

    try {
      let filesToSend = archivos || [];

      // Si hay archivos seleccionados, convertirlos y agregarlos
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try {
          // Procesar todos los archivos de forma asíncrona
          const filePromises = selectedFiles.map(async (file, index) => {
            console.log(
              `📁 Procesando archivo ${index + 1}/${selectedFiles.length}:`,
              file.name
            );
            const response = await fetch(file.uri);
            const blob = await response.blob();

            return new Promise<{
              tipo: string;
              nombre: string;
              contenido: string;
            }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                const base64Data = base64.split(",")[1];

                const archivo = {
                  tipo: file.mimeType || file.type,
                  nombre: file.name,
                  contenido: base64Data, // Enviar como string base64, no como bytes
                };
                console.log(
                  `✅ Archivo ${index + 1} procesado:`,
                  archivo.nombre,
                  "Tamaño base64:",
                  base64Data.length
                );
                resolve(archivo);
              };
              reader.readAsDataURL(blob);
            });
          });

          // Esperar a que todos los archivos se procesen
          const processedFiles = await Promise.all(filePromises);
          console.log(
            `🎉 Todos los archivos procesados:`,
            processedFiles.length
          );
          filesToSend = [...filesToSend, ...processedFiles];

          // Enviar mensaje con archivos
          sendMessageToAPI(messageText, filesToSend);
        } catch (error) {
          console.error("Error processing files:", error);
          Alert.alert("Error", "No se pudieron procesar los archivos");
          setIsUploading(false);
          setIsTyping(false);
          return;
        }
      } else {
        // Enviar solo mensaje de texto
        sendMessageToAPI(messageText, filesToSend);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "No se pudo enviar el mensaje");
      setIsTyping(false);
    }
  };

  const sendMessageToAPI = async (
    text: string,
    archivos: Array<{ tipo: string; nombre: string; contenido: string }>
  ) => {
    try {
      const payload = {
        mensaje: text,
        session_id: sessionId,
        archivos: archivos,
      };

      console.log("🔄 Enviando mensaje a la API:");
      console.log("📝 Texto:", text);
      console.log("📎 Archivos:", archivos.length);
      console.log("🆔 Session ID:", sessionId);

      // Log detallado de cada archivo
      archivos.forEach((archivo, index) => {
        console.log(`📄 Archivo ${index + 1}:`, {
          nombre: archivo.nombre,
          tipo: archivo.tipo,
          contenido_length: archivo.contenido.length,
          contenido_preview: archivo.contenido.substring(0, 50) + "...",
        });
      });

      // Verificar estado de la sesión
      if (sessionId) {
        try {
          const sessionResponse = await fetch(
            `${API_ENDPOINTS.SESION}/${sessionId}`
          );
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log("📊 Estado de sesión:", sessionData);
          }
        } catch (error) {
          console.log("⚠️ No se pudo verificar el estado de la sesión:", error);
        }
      }

      const response = await fetch(API_ENDPOINTS.CHATBOT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatbotResponse = await response.json();
      setIsConnected(true);

      console.log("✅ Respuesta recibida:", data);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.mensaje,
        isBot: true,
        timestamp: new Date(),
        options: data.opciones,
        tipo: data.tipo,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.session_id) {
        setSessionId(data.session_id);
      }
    } catch (error) {
      console.error("❌ Error in API call:", error);
      setIsConnected(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsUploading(false);
    }
  };

  const handleOptionPress = (option: { texto: string; valor: string }) => {
    sendMessage(option.texto);
  };

  const pickDocument = async () => {
    try {
      if (selectedFiles.length >= 3) {
        Alert.alert(
          "Límite alcanzado",
          "Puedes seleccionar máximo 3 archivos a la vez"
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFiles((prev) => [
          ...prev,
          {
            uri: result.assets[0].uri,
            name: result.assets[0].name || `documento_${Date.now()}`,
            type: "documento",
            mimeType: result.assets[0].mimeType,
          },
        ]);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "No se pudo seleccionar el documento");
    }
  };

  const takePhoto = async () => {
    try {
      if (selectedFiles.length >= 3) {
        Alert.alert(
          "Límite alcanzado",
          "Puedes seleccionar máximo 3 archivos a la vez"
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos",
          "Se necesitan permisos de cámara para tomar fotos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFiles((prev) => [
          ...prev,
          {
            uri: result.assets[0].uri,
            name: `foto_${Date.now()}.jpg`,
            type: "imagen",
            mimeType: "image/jpeg",
          },
        ]);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const pickImage = async () => {
    try {
      if (selectedFiles.length >= 3) {
        Alert.alert(
          "Límite alcanzado",
          "Puedes seleccionar máximo 3 archivos a la vez"
        );
        return;
      }

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos",
          "Se necesitan permisos de galería para seleccionar imágenes"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFiles((prev) => [
          ...prev,
          {
            uri: result.assets[0].uri,
            name: result.assets[0].fileName || `imagen_${Date.now()}.jpg`,
            type: "imagen",
            mimeType:
              result.assets[0].type === "image" ? "image/jpeg" : undefined,
          },
        ]);
        setShowAttachmentModal(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
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
            {/* Botón Nuevo Chat */}
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={iniciarNuevoChat}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.newChatButtonText}>Nuevo chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View
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

              {/* Opciones del bot */}
              {message.isBot &&
                message.options &&
                message.options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {message.options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.optionButton}
                        onPress={() => handleOptionPress(option)}
                      >
                        <Text style={styles.optionText}>{option.texto}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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

          {/* Uploading Indicator */}
          {isUploading && (
            <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
              <View style={styles.messageAvatar}>
                <Bot size={20} color="#FFFFFF" />
              </View>
              <View style={[styles.messageBubble, styles.botMessage]}>
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#1E40AF" />
                  <Text style={styles.uploadingText}>Subiendo archivo...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Selected File Preview */}
        {selectedFiles.length > 0 && (
          <View style={styles.selectedFileContainer}>
            <View style={styles.selectedFileContent}>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.selectedFilePreviewItem}>
                  {file.type === "imagen" ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.selectedFileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.selectedFileIcon}>
                      <FileText size={24} color="#1E40AF" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removeSelectedFile(index)}
                  >
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={() => setShowAttachmentModal(true)}
            >
              <Paperclip size={20} color="#64748B" />
            </TouchableOpacity>
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
                !inputText.trim() &&
                  !selectedFiles.length &&
                  styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={
                (!inputText.trim() && !selectedFiles.length) || isTyping
              }
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Attachment Modal */}
        <Modal
          visible={showAttachmentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAttachmentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar archivo</Text>

              {/* Indicador de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <View style={styles.filesCounter}>
                  <Text style={styles.filesCounterText}>
                    {selectedFiles.length}/3 archivos seleccionados
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedFiles.length >= 3 && styles.modalOptionDisabled,
                ]}
                onPress={takePhoto}
                disabled={selectedFiles.length >= 3}
              >
                <Camera
                  size={24}
                  color={selectedFiles.length >= 3 ? "#CBD5E1" : "#1E40AF"}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedFiles.length >= 3 && styles.modalOptionTextDisabled,
                  ]}
                >
                  Tomar foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedFiles.length >= 3 && styles.modalOptionDisabled,
                ]}
                onPress={pickImage}
                disabled={selectedFiles.length >= 3}
              >
                <FileText
                  size={24}
                  color={selectedFiles.length >= 3 ? "#CBD5E1" : "#1E40AF"}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedFiles.length >= 3 && styles.modalOptionTextDisabled,
                  ]}
                >
                  Seleccionar imagen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedFiles.length >= 3 && styles.modalOptionDisabled,
                ]}
                onPress={pickDocument}
                disabled={selectedFiles.length >= 3}
              >
                <Paperclip
                  size={24}
                  color={selectedFiles.length >= 3 ? "#CBD5E1" : "#1E40AF"}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedFiles.length >= 3 && styles.modalOptionTextDisabled,
                  ]}
                >
                  Seleccionar documento
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAttachmentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    flex: 1,
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
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E40AF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  newChatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
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
  optionsContainer: {
    marginLeft: 40,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  optionText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadingText: {
    fontSize: 16,
    color: "#64748B",
    marginLeft: 8,
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
  attachmentButton: {
    padding: 8,
    marginRight: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#1E293B",
    marginLeft: 16,
  },
  modalOptionDisabled: {
    opacity: 0.5,
  },
  modalOptionTextDisabled: {
    color: "#CBD5E1",
  },
  filesCounter: {
    alignItems: "center",
    marginBottom: 20,
  },
  filesCounterText: {
    fontSize: 14,
    color: "#64748B",
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  selectedFileContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  selectedFileContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedFilePreviewItem: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  selectedFileImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  selectedFileIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  selectedFileType: {
    fontSize: 12,
    color: "#64748B",
  },
  removeFileButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});
