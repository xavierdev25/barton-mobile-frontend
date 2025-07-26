import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Calendar, Users, Award } from 'lucide-react-native';

const newsData = [
  {
    id: 1,
    title: 'Ceremonia de Graduación 2024',
    summary:
      'Celebramos a nuestros graduados de la promoción 2024 en una emotiva ceremonia.',
    image:
      'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=800',
    date: '15 Dic 2024',
    category: 'Eventos',
  },
  {
    id: 2,
    title: 'Nuevo Laboratorio de Ciencias',
    summary:
      'Inauguramos nuestro moderno laboratorio equipado con tecnología de vanguardia.',
    image:
      'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=800',
    date: '12 Dic 2024',
    category: 'Infraestructura',
  },
  {
    id: 3,
    title: 'Olimpiadas de Matemáticas',
    summary:
      'Nuestros estudiantes brillaron en las olimpiadas regionales de matemáticas.',
    image:
      'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
    date: '8 Dic 2024',
    category: 'Académico',
  },
];

const quickStats = [
  { icon: Users, label: 'Estudiantes', value: '250' },
  { icon: Award, label: 'Logros', value: '45' },
  { icon: Calendar, label: 'Años', value: '10' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Colegio Barton</Text>
            <Text style={styles.headerSubtitle}>Bienvenido de vuelta</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <stat.icon size={24} color="#1E40AF" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* News Section */}
        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>Noticias Destacadas</Text>

          {newsData.map((news) => (
            <TouchableOpacity key={news.id} style={styles.newsCard}>
              <Image source={{ uri: news.image }} style={styles.newsImage} />
              <View style={styles.newsContent}>
                <View style={styles.newsHeader}>
                  <Text style={styles.newsCategory}>{news.category}</Text>
                  <Text style={styles.newsDate}>{news.date}</Text>
                </View>
                <Text style={styles.newsTitle}>{news.title}</Text>
                <Text style={styles.newsSummary}>{news.summary}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Calendar size={32} color="#059669" />
              <Text style={styles.actionTitle}>Calendario</Text>
              <Text style={styles.actionSubtitle}>Ver eventos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Users size={32} color="#059669" />
              <Text style={styles.actionTitle}>Directorio</Text>
              <Text style={styles.actionSubtitle}>Contactos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  newsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newsDate: {
    fontSize: 12,
    color: '#64748B',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  newsSummary: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
