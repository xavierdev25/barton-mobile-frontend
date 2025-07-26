import { Ionicons } from "@expo/vector-icons";
import {
  Calendar,
  CircleCheck as CheckCircle,
  CreditCard,
  Search,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_URL = "https://barton-mobile-chatbot.onrender.com";

// Utilidades para formato y fechas
const formatCardNumber = (text: string) =>
  text
    .replace(/[^0-9]/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
const formatExpiryDate = (text: string) =>
  text
    .replace(/[^0-9]/g, "")
    .replace(/(\d{2})(\d{0,2})/, "$1/$2")
    .substr(0, 5);
const getDaysRemaining = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export default function PaymentsScreen() {
  // Estados globales del flujo
  const [view, setView] = useState<
    "verify" | "list" | "gateway" | "confirmation"
  >("verify");
  const [studentCode, setStudentCode] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "bank" | "mobile"
  >("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Simulación de códigos válidos para ejemplo
  const validCodes = { "12345": {}, "67890": {}, "54321": {} };

  // 1. Verificación de código
  const handleVerifyCode = async () => {
    if (!studentCode.trim()) {
      Alert.alert("Error", "Por favor ingresa un código modular");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/pagos?codigo=${encodeURIComponent(studentCode)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.error || "Código modular (SIAGE) no encontrado"
        );
        setLoading(false);
        return;
      }
      const data = await response.json();
      // Adaptar datos a formato de PaymentsList
      const payments = (data.pagos || []).map((tipo: string, idx: number) => {
        // Extraer monto y fecha de detalle si es posible
        const detalle = data.detalle[idx] || "";
        const montoMatch = /([0-9]+)\s*soles/.exec(detalle);
        const amount = montoMatch ? parseFloat(montoMatch[1]) : 0;
        return {
          id: `${tipo}-${idx}`,
          type: tipo.includes("Matrícula") ? "Matrícula" : "Pensión",
          month: tipo.includes("Pensión") ? `Mes ${idx + 1}` : undefined,
          amount,
          dueDate: "2024-12-15", // Simulación, puedes ajustar si backend da fecha
          status: "pending",
        };
      });
      setStudentData({
        name: data.nombre,
        grade: data.grado,
        photo:
          "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.nombre),
        payments,
      });
      setView("list");
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo conectar con el servidor. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Selección de pago
  const handleSelectPayment = (payment: any) => {
    setSelectedPayment(payment);
    setView("gateway");
  };

  // 3. Procesar pago
  const handleProcessPayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaymentSuccess(true);
      setView("confirmation");
      // Marcar como pagado en la lista (simulado)
      setStudentData((prev: any) => ({
        ...prev,
        payments: prev.payments.map((p: any) =>
          p.id === selectedPayment.id ? { ...p, status: "paid" } : p
        ),
      }));
    }, 1500);
  };

  // 4. Volver a lista de pagos
  const handleBackToPayments = () => {
    setSelectedPayment(null);
    setPaymentSuccess(false);
    setView("list");
  };

  // 5. Finalizar y volver a inicio
  const handleFinish = () => {
    setStudentCode("");
    setStudentData(null);
    setSelectedPayment(null);
    setPaymentSuccess(false);
    setView("verify");
  };

  // Helpers para resumen
  const getPendingCount = () =>
    studentData
      ? studentData.payments.filter((p: any) => p.status === "pending").length
      : 0;
  const getTotalAmount = () =>
    studentData
      ? studentData.payments
          .filter((p: any) => p.status === "pending")
          .reduce((acc: number, p: any) => acc + p.amount, 0)
      : 0;

  // 1. CodeVerification
  const renderCodeVerification = () => (
    <View style={styles.searchContainer}>
      <View style={styles.headerSection}>
        <CreditCard size={48} color="#1E40AF" />
        <Text style={styles.title}>Consulta de Pagos</Text>
        <Text style={styles.subtitle}>
          Ingresa tu código modular (SIAGE) para consultar tus pagos pendientes
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Código Modular (SIAGE)</Text>
        <View style={styles.inputWrapper}>
          <Search size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={studentCode}
            onChangeText={setStudentCode}
            placeholder="Ej: 12345"
            keyboardType="numeric"
            maxLength={14}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.searchButton, loading && styles.searchButtonDisabled]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        <Text style={styles.searchButtonText}>
          {loading ? "Buscando..." : "Consultar Pagos"}
        </Text>
      </TouchableOpacity>
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
        <Text style={styles.helpText}>
          Si no recuerdas tu código modular, puedes consultar en la sección de
          Chatbot
        </Text>
      </View>
    </View>
  );

  // 2. PaymentsList
  const renderPaymentsList = () => (
    <ScrollView style={styles.paymentsContainer}>
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <Image
            source={{ uri: studentData.photo }}
            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
          />
          <View>
            <Text style={styles.studentName}>{studentData.name}</Text>
            <Text style={styles.studentGrade}>{studentData.grade}</Text>
            <Text style={styles.studentCode}>Código: {studentCode}</Text>
          </View>
        </View>
      </View>
      {studentData.payments.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 32 }}>
          <CheckCircle size={60} color="#059669" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#059669",
              marginTop: 8,
            }}
          >
            ¡Pagos al día!
          </Text>
          <Text style={{ color: "#64748B", marginTop: 4 }}>
            No tienes pagos pendientes en este momento.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.paymentsTitle}>Resumen de Pagos</Text>
            <Text style={{ color: "#64748B" }}>
              {getPendingCount()} conceptos pendientes
            </Text>
            <Text
              style={{ color: "#1E293B", fontWeight: "bold", fontSize: 18 }}
            >
              Total: S/ {getTotalAmount().toFixed(2)}
            </Text>
          </View>
          {studentData.payments.map((payment: any) => {
            const daysRemaining = getDaysRemaining(payment.dueDate);
            const isOverdue = daysRemaining < 0;
            const isCloseToOverdue = daysRemaining >= 0 && daysRemaining <= 5;
            return (
              <TouchableOpacity
                key={payment.id}
                style={[
                  styles.paymentCard,
                  isOverdue ? { borderColor: "#b91c1c", borderWidth: 2 } : {},
                  payment.status === "paid" ? { opacity: 0.5 } : {},
                ]}
                onPress={() =>
                  payment.status !== "paid" && handleSelectPayment(payment)
                }
                disabled={payment.status === "paid"}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentType}>
                    <Text style={styles.paymentTypeText}>{payment.type}</Text>
                    {payment.month && (
                      <Text style={styles.paymentMonth}>{payment.month}</Text>
                    )}
                  </View>
                  <Text style={styles.amountText}>
                    S/ {payment.amount.toFixed(2)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Calendar
                    size={16}
                    color={
                      isOverdue
                        ? "#b91c1c"
                        : isCloseToOverdue
                        ? "#ea580c"
                        : "#666"
                    }
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: isOverdue
                        ? "#b91c1c"
                        : isCloseToOverdue
                        ? "#ea580c"
                        : "#666",
                    }}
                  >
                    {isOverdue
                      ? "VENCIDO"
                      : isCloseToOverdue
                      ? `${daysRemaining} días restantes`
                      : new Date(payment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                {payment.status === "paid" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <CheckCircle size={18} color="#059669" />
                    <Text style={{ color: "#059669", marginLeft: 6 }}>
                      Pagado
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handleSelectPayment(payment)}
                  >
                    <Text style={styles.payButtonText}>Pagar Ahora</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}
      <TouchableOpacity style={styles.backButton} onPress={handleFinish}>
        <Text style={styles.backButtonText}>Nueva Consulta</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 3. PaymentGateway
  const renderPaymentGateway = () => (
    <ScrollView style={styles.paymentsContainer}>
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <Image
            source={{ uri: studentData.photo }}
            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
          />
          <View>
            <Text style={styles.studentName}>{studentData.name}</Text>
            <Text style={styles.studentGrade}>{studentData.grade}</Text>
            <Text style={styles.studentCode}>Código: {studentCode}</Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentCard}>
        <Text style={styles.paymentsTitle}>Pasarela de Pagos</Text>
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{ fontWeight: "bold", color: "#1E293B", marginBottom: 4 }}
          >
            Detalle del Pago
          </Text>
          <Text>
            Concepto:{" "}
            <Text style={{ fontWeight: "bold" }}>{selectedPayment.type}</Text>
          </Text>
          {selectedPayment.month && (
            <Text>
              Periodo:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {selectedPayment.month}
              </Text>
            </Text>
          )}
          <Text>
            Monto:{" "}
            <Text style={{ fontWeight: "bold" }}>
              S/ {selectedPayment.amount.toFixed(2)}
            </Text>
          </Text>
          <Text>
            Fecha límite:{" "}
            <Text
              style={{
                color:
                  getDaysRemaining(selectedPayment.dueDate) < 0
                    ? "#b91c1c"
                    : "#1E293B",
                fontWeight: "bold",
              }}
            >
              {new Date(selectedPayment.dueDate).toLocaleDateString()}
            </Text>
          </Text>
        </View>
        <Text style={{ fontWeight: "bold", color: "#1E293B", marginBottom: 8 }}>
          Método de Pago
        </Text>
        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          {[
            { key: "card", label: "Tarjeta", icon: "card" },
            { key: "bank", label: "Banco", icon: "business" },
            { key: "mobile", label: "Móvil", icon: "phone-portrait" },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={{
                flex: 1,
                borderWidth: 2,
                borderColor:
                  paymentMethod === option.key ? "#1E40AF" : "#E5E7EB",
                backgroundColor:
                  paymentMethod === option.key ? "#EFF6FF" : "#FFF",
                padding: 10,
                alignItems: "center",
                borderRadius: 8,
                marginHorizontal: 4,
              }}
              onPress={() => setPaymentMethod(option.key as any)}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={paymentMethod === option.key ? "#1E40AF" : "#666"}
              />
              <Text
                style={{
                  color: paymentMethod === option.key ? "#1E40AF" : "#666",
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Formulario Tarjeta */}
        {paymentMethod === "card" && (
          <>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Nombre en la tarjeta"
                value={cardName}
                onChangeText={setCardName}
                maxLength={50}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="card"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Número de tarjeta"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                maxLength={19}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="MM/AA"
                  value={cardExpiry}
                  onChangeText={(text) => setCardExpiry(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="CVV"
                  value={cardCVV}
                  onChangeText={setCardCVV}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text style={{ color: "#059669", marginLeft: 8 }}>
                Pago seguro con encriptación SSL de 256 bits
              </Text>
            </View>
          </>
        )}
        {/* Info Banco */}
        {paymentMethod === "bank" && (
          <View style={{ marginVertical: 12 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Banco de Crédito del Perú
            </Text>
            <Text>Cuenta: 191-2345678-0-45</Text>
            <Text>CCI: 002-191-002345678045-10</Text>
            <Text>Titular: Colegio San Agustín</Text>
            <Text>
              Referencia: {selectedPayment.id}-{studentCode}
            </Text>
            <Text style={{ marginTop: 8, fontWeight: "bold" }}>
              Instrucciones:
            </Text>
            <Text>
              1. Realiza la transferencia por el monto exacto indicado.
            </Text>
            <Text>
              2. Incluye el código de referencia en la descripción del pago.
            </Text>
            <Text>
              3. Guarda el comprobante y envíalo a tesoreria@colegio.edu.pe.
            </Text>
          </View>
        )}
        {/* Pago Móvil */}
        {paymentMethod === "mobile" && (
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <Image
              source={require("../../assets/images/QR.png")}
              style={{ width: 120, height: 120, marginBottom: 8 }}
            />
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Escanea el código QR con tu app de pagos
            </Text>
            <Text style={{ color: "#64748B", textAlign: "center" }}>
              Una vez realizado el pago, recibirás una confirmación automática.
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.payButton,
            loading && styles.searchButtonDisabled,
            { marginTop: 16 },
          ]}
          onPress={handleProcessPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>
              {paymentMethod === "card"
                ? "Pagar Ahora"
                : paymentMethod === "bank"
                ? "Confirmar Pago"
                : "Verificar Pago"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 12 }]}
          onPress={handleBackToPayments}
        >
          <Text style={styles.backButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // 4. PaymentConfirmation
  const renderPaymentConfirmation = () => (
    <View style={styles.paymentsContainer}>
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <Image
            source={{ uri: studentData.photo }}
            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
          />
          <View>
            <Text style={styles.studentName}>{studentData.name}</Text>
            <Text style={styles.studentGrade}>{studentData.grade}</Text>
            <Text style={styles.studentCode}>Código: {studentCode}</Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentCard}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="checkmark-circle" size={80} color="#059669" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#059669",
              marginTop: 8,
            }}
          >
            ¡Pago Exitoso!
          </Text>
          <Text style={{ color: "#64748B", marginTop: 4 }}>
            Tu pago ha sido procesado correctamente
          </Text>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text>
            Concepto:{" "}
            <Text style={{ fontWeight: "bold" }}>{selectedPayment.type}</Text>
          </Text>
          {selectedPayment.month && (
            <Text>
              Periodo:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {selectedPayment.month}
              </Text>
            </Text>
          )}
          <Text>
            Monto:{" "}
            <Text style={{ fontWeight: "bold" }}>
              S/ {selectedPayment.amount.toFixed(2)}
            </Text>
          </Text>
          <Text>
            Fecha:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {new Date().toLocaleDateString()}
            </Text>
          </Text>
          <Text>
            Código de operación:{" "}
            <Text style={{ fontWeight: "bold" }}>
              PAY-{Math.floor(Math.random() * 1000000)}
            </Text>
          </Text>
          <Text>
            Estado:{" "}
            <Text style={{ color: "#059669", fontWeight: "bold" }}>Pagado</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, { marginBottom: 8 }]}
          onPress={handleFinish}
        >
          <Text style={styles.payButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render principal según el estado del flujo
  return (
    <SafeAreaView style={styles.container}>
      {view === "verify" && renderCodeVerification()}
      {view === "list" && renderPaymentsList()}
      {view === "gateway" && renderPaymentGateway()}
      {view === "confirmation" && renderPaymentConfirmation()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9", // Más suave
  },
  searchContainer: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
  },
  paymentsContainer: {
    flex: 1,
    padding: 18,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#E0E7EF",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 12,
    color: "#1F2937",
    backgroundColor: "transparent",
  },
  searchButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  searchButtonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  helpSection: {
    backgroundColor: "#E0E7EF",
    padding: 20,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderLeftColor: "#2563EB",
    marginTop: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 18,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1E293B",
    marginLeft: 12,
    flex: 1,
  },
  studentGrade: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 4,
  },
  studentCode: {
    fontSize: 14,
    color: "#64748B",
  },
  paymentsTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#E0E7EF",
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  paymentType: {
    flex: 1,
  },
  paymentTypeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  paymentMonth: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  amountText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#059669",
    marginLeft: 4,
  },
  payButton: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    minHeight: 48,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  backButton: {
    backgroundColor: "#64748B",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
    minHeight: 48,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
