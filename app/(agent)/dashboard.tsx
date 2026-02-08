import { useEffect, useState, useCallback } from 'react';
import { RefreshControl } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  H2,
  H3,
  ScrollView,
  Card,
  Spinner,
  View
} from 'tamagui';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';

type Stats = {
  total: number;
  en_attente: number;
  en_cours: number;
  traite: number;
};

export default function DashboardScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    traite: 0,
  });
  const [recentDemandes, setRecentDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: allDemandes, error: statsError } = await supabase
        .from('demandes')
        .select('status');

      if (statsError) throw statsError;

      const statsData = {
        total: allDemandes?.length || 0,
        en_attente: allDemandes?.filter(d => d.status === 'en_attente').length || 0,
        en_cours: allDemandes?.filter(d => d.status === 'en_cours').length || 0,
        traite: allDemandes?.filter(d => d.status === 'traite').length || 0,
      };
      setStats(statsData);

      const { data: recent, error: recentError } = await supabase
        .from('demandes')
        .select(`
          *,
          profiles:client_id (phone, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentDemandes(recent || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('agent-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandes',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
  }) => (
    <Card
      flex={1}
      padding="$4"
      borderRadius={16}
      backgroundColor="#FFFFFF"
      borderWidth={1}
      borderColor="#E2E8F0"
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack>
          <Text color="#64748B" fontSize={13} marginBottom={4}>
            {title}
          </Text>
          <Text fontWeight="700" fontSize={28} color="#1E293B">
            {value}
          </Text>
        </YStack>
        <View
          backgroundColor={bgColor}
          padding={10}
          borderRadius={12}
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={22} color={color} />
        </View>
      </XStack>
    </Card>
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'en_attente':
        return { label: 'En attente', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'en_cours':
        return { label: 'En cours', color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'traite':
        return { label: 'Traité', color: '#10B981', bgColor: '#D1FAE5' };
      default:
        return { label: status, color: '#64748B', bgColor: '#F1F5F9' };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <StatusBar style="dark" />
      <ScrollView
        flex={1}
        backgroundColor="#F1F5F9"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <YStack padding="$4" paddingBottom="$2">
          <Text color="#64748B" fontSize={16}>
            {getGreeting()},
          </Text>
          <H2 color="#1E293B">
            Agent {profile?.full_name || ''} 🎧
          </H2>
        </YStack>

        {loading ? (
          <YStack alignItems="center" padding="$8">
            <Spinner size="large" color="#10B981" />
          </YStack>
        ) : (
          <>
            {/* Statistiques */}
            <YStack padding="$4" paddingTop="$2" gap="$3">
              <XStack gap="$3">
                <StatCard
                  title="En attente"
                  value={stats.en_attente}
                  icon={Clock}
                  color="#F59E0B"
                  bgColor="#FEF3C7"
                />
                <StatCard
                  title="En cours"
                  value={stats.en_cours}
                  icon={AlertCircle}
                  color="#3B82F6"
                  bgColor="#DBEAFE"
                />
              </XStack>

              <XStack gap="$3">
                <StatCard
                  title="Traités"
                  value={stats.traite}
                  icon={CheckCircle}
                  color="#10B981"
                  bgColor="#D1FAE5"
                />
                <StatCard
                  title="Total"
                  value={stats.total}
                  icon={TrendingUp}
                  color="#8B5CF6"
                  bgColor="#EDE9FE"
                />
              </XStack>
            </YStack>

            {/* Demandes récentes */}
            <YStack padding="$4" paddingTop="$0">
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                <H3 color="#1E293B">Demandes récentes</H3>
                {stats.en_attente > 0 && (
                  <View
                    backgroundColor="#EF4444"
                    paddingHorizontal={10}
                    paddingVertical={4}
                    borderRadius={12}
                  >
                    <Text color="white" fontSize={12} fontWeight="600">
                      {stats.en_attente} nouvelle{stats.en_attente > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </XStack>

              {recentDemandes.length === 0 ? (
                <Card
                  padding="$6"
                  backgroundColor="#FFFFFF"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                >
                  <YStack alignItems="center">
                    <Text fontSize={48} marginBottom="$2">📭</Text>
                    <Text color="#64748B" textAlign="center">
                      Aucune demande pour le moment
                    </Text>
                  </YStack>
                </Card>
              ) : (
                <YStack gap="$3">
                  {recentDemandes.map((demande) => {
                    const statusConfig = getStatusConfig(demande.status);

                    return (
                      <Card
                        key={demande.id}
                        padding="$4"
                        borderRadius={16}
                        backgroundColor="#FFFFFF"
                        borderWidth={1}
                        borderColor="#E2E8F0"
                      >
                        <XStack justifyContent="space-between" alignItems="flex-start">
                          <YStack flex={1}>
                            <Text fontWeight="700" color="#1E293B" fontSize={16}>
                              {demande.medicament_nom}
                            </Text>
                            <XStack gap="$2" alignItems="center" marginTop={6}>
                              <Users size={14} color="#64748B" />
                              <Text color="#64748B" fontSize={13}>
                                {demande.profiles?.full_name || demande.profiles?.phone || 'Client'}
                              </Text>
                            </XStack>
                            <Text color="#94A3B8" fontSize={12} marginTop={4}>
                              {formatTime(demande.created_at)}
                            </Text>
                          </YStack>

                          <View
                            backgroundColor={statusConfig.bgColor}
                            paddingHorizontal={10}
                            paddingVertical={4}
                            borderRadius={8}
                          >
                            <Text
                              color={statusConfig.color}
                              fontSize={12}
                              fontWeight="600"
                            >
                              {statusConfig.label}
                            </Text>
                          </View>
                        </XStack>
                      </Card>
                    );
                  })}
                </YStack>
              )}
            </YStack>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
