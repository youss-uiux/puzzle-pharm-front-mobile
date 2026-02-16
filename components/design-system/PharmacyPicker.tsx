/**
 * PharmacyPicker Component
 * Sélecteur de pharmacie pour les agents
 * Affiche la liste des pharmacies sans les numéros de téléphone
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  X,
  MapPin,
  ChevronDown,
  Check,
  Building2,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from './index';
import { PharmaciePublic } from '../../lib/supabase';
import { usePharmacies } from '../../hooks/usePharmacies';

interface PharmacyPickerProps {
  selectedPharmacy: PharmaciePublic | null;
  onSelect: (pharmacy: PharmaciePublic) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export const PharmacyPicker: React.FC<PharmacyPickerProps> = ({
  selectedPharmacy,
  onSelect,
  placeholder = 'Sélectionner une pharmacie',
  error = false,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { pharmacies, loading, quartiers } = usePharmacies();
  const [selectedQuartier, setSelectedQuartier] = useState<string | null>(null);

  // Filtrer les pharmacies
  const filteredPharmacies = useMemo(() => {
    let result = pharmacies;

    // Filtrer par quartier
    if (selectedQuartier) {
      result = result.filter(p => p.quartier === selectedQuartier);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.nom.toLowerCase().includes(query) ||
        p.quartier.toLowerCase().includes(query)
      );
    }

    return result;
  }, [pharmacies, searchQuery, selectedQuartier]);

  const handleSelect = (pharmacy: PharmaciePublic) => {
    onSelect(pharmacy);
    setModalVisible(false);
    setSearchQuery('');
    setSelectedQuartier(null);
  };

  const renderPharmacyItem = ({ item }: { item: PharmaciePublic }) => {
    const isSelected = selectedPharmacy?.id === item.id;

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [
          styles.pharmacyItem,
          isSelected && styles.pharmacyItemSelected,
          pressed && styles.pharmacyItemPressed,
        ]}
      >
        <View style={styles.pharmacyIcon}>
          <Building2
            size={20}
            color={isSelected ? colors.accent.primary : colors.text.tertiary}
          />
        </View>
        <View style={styles.pharmacyInfo}>
          <Text style={[
            styles.pharmacyName,
            isSelected && styles.pharmacyNameSelected,
          ]}>
            {item.nom}
          </Text>
          <View style={styles.pharmacyLocation}>
            <MapPin size={12} color={colors.text.tertiary} />
            <Text style={styles.pharmacyQuartier}>{item.quartier}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkIcon}>
            <Check size={20} color={colors.accent.primary} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <>
      {/* Trigger Button */}
      <Pressable
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.triggerPressed,
        ]}
      >
        {selectedPharmacy ? (
          <View style={styles.selectedContent}>
            <Building2 size={18} color={colors.accent.primary} />
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName} numberOfLines={1}>
                {selectedPharmacy.nom}
              </Text>
              <Text style={styles.selectedQuartier}>
                {selectedPharmacy.quartier}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <ChevronDown size={20} color={colors.text.tertiary} />
      </Pressable>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une pharmacie</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Search size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une pharmacie..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                selectionColor={colors.accent.primary}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={18} color={colors.text.tertiary} />
                </Pressable>
              ) : null}
            </View>

            {/* Quartier Filter */}
            <View style={styles.quartiersContainer}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={['Tous', ...quartiers]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isAll = item === 'Tous';
                  const isActive = isAll ? !selectedQuartier : selectedQuartier === item;

                  return (
                    <Pressable
                      onPress={() => setSelectedQuartier(isAll ? null : item)}
                      style={[
                        styles.quartierChip,
                        isActive && styles.quartierChipActive,
                      ]}
                    >
                      <Text style={[
                        styles.quartierChipText,
                        isActive && styles.quartierChipTextActive,
                      ]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                }}
                contentContainerStyle={styles.quartiersContent}
              />
            </View>

            {/* Results Count */}
            <Text style={styles.resultsCount}>
              {filteredPharmacies.length} pharmacie{filteredPharmacies.length > 1 ? 's' : ''}
            </Text>

            {/* Pharmacies List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredPharmacies}
                keyExtractor={(item) => item.id}
                renderItem={renderPharmacyItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Building2 size={48} color={colors.text.tertiary} />
                    <Text style={styles.emptyText}>
                      Aucune pharmacie trouvée
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  triggerError: {
    borderColor: colors.error.primary,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerPressed: {
    borderColor: colors.accent.primary,
  },
  placeholder: {
    ...typography.body,
    color: colors.text.tertiary,
    flex: 1,
  },
  selectedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    ...typography.label,
    color: colors.text.primary,
  },
  selectedQuartier: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    maxHeight: '85%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.button,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    ...typography.body,
    color: colors.text.primary,
  },

  // Quartiers
  quartiersContainer: {
    marginTop: spacing.md,
  },
  quartiersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  quartierChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: spacing.sm,
  },
  quartierChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  quartierChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  quartierChipTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Results Count
  resultsCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pharmacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pharmacyItemSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.ultraLight,
  },
  pharmacyItemPressed: {
    opacity: 0.8,
  },
  pharmacyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 2,
  },
  pharmacyNameSelected: {
    color: colors.accent.primary,
  },
  pharmacyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pharmacyQuartier: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },

  // Loading
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },

  // Empty
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default PharmacyPicker;

