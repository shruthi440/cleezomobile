import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { createAppStyles } from './App.styles';

type IconKind = 'material' | 'fontawesome';

type DashboardTile = {
  label: string;
  icon: string;
  kind: IconKind;
};

type StatCard = {
  title: string;
  subtitle: string;
  footer: string;
  icon: string;
  kind: IconKind;
  background: string;
};

const heroImage: ImageSourcePropType = require('../assets/StudentReport.png');
const logoImage: ImageSourcePropType = require('../assets/Cleezo.png');

const topChips = ['Register', 'Admission', 'Test & Couns.', 'Enrollment'];

const dashboardTiles: DashboardTile[] = [
  { label: 'Register', icon: 'person-add', kind: 'material' },
  { label: 'Admission', icon: 'person', kind: 'material' },
  { label: 'Test & Couns.', icon: 'groups', kind: 'material' },
  { label: 'Enrollment', icon: 'school', kind: 'material' },
  { label: 'Communication', icon: 'forum', kind: 'material' },
  { label: 'Report', icon: 'description', kind: 'material' },
];

const campaignCards: StatCard[] = [
  {
    title: '14',
    subtitle: 'Posters to 9 Leads',
    footer: '2 sent today',
    icon: 'whatsapp',
    kind: 'fontawesome',
    background: '#D7E7CD',
  },
  {
    title: '18',
    subtitle: 'Templates to 9 Leads',
    footer: '9 sent today',
    icon: 'envelope-o',
    kind: 'fontawesome',
    background: '#F0EE96',
  },
];

const renderIcon = (kind: IconKind, name: string, color: string, size: number) => {
  if (kind === 'fontawesome') {
    return <FontAwesome name={name} size={size} color={color} />;
  }

  return <MaterialIcons name={name} size={size} color={color} />;
};

const DashboardScreen = () => {
  const { width, height } = useWindowDimensions();
  const phoneWidth = Math.min(Math.max(width - 24, 320), 390);
  const phoneHeight = Math.min(Math.max(height - 24, 720), 860);
  const styles = createAppStyles({ phoneWidth, phoneHeight });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E0F" />

      <View style={styles.background}>
        <View style={styles.phoneShell}>
          <View style={styles.phoneFrame}>
            <View style={styles.notch} />

            <View style={styles.statusRow}>
              <Text style={styles.timeText}>4:00</Text>
              <View style={styles.statusIcons}>
                <Text style={styles.statusGlyph}>▂▅▇</Text>
                <Text style={[styles.statusGlyph, styles.statusGlyphSpacing]}>⌁</Text>
                <Text style={[styles.statusGlyph, styles.statusGlyphSpacing]}>▭</Text>
              </View>
            </View>

            <View style={styles.toolbar}>
              <Pressable style={styles.toolbarButton}>
                <Text style={styles.toolbarButtonText}>☰</Text>
              </Pressable>
              <View style={styles.toolbarSpacer} />
              <Pressable style={styles.toolbarButton}>
                <Text style={styles.toolbarButtonText}>◌</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {topChips.map((chip, index) => {
                  const active = index === 1;

                  return (
                    <Pressable
                      key={chip}
                      style={[
                        styles.chip,
                        index !== topChips.length - 1 && styles.chipSpacing,
                        active ? styles.chipActive : styles.chipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active ? styles.chipTextActive : styles.chipTextInactive,
                        ]}
                      >
                        {chip}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.heroCard}>
                <View style={styles.heroGlow} />
                <Image source={heroImage} style={styles.heroImage} resizeMode="contain" />
              </View>

              <Text style={styles.sectionTitle}>Dashboard</Text>

              <View style={styles.grid}>
                {dashboardTiles.map((tile) => (
                  <Pressable key={tile.label} style={styles.gridCard}>
                    <View style={styles.gridIconWrap}>
                      {renderIcon(tile.kind, tile.icon, '#7F7F84', 26)}
                    </View>
                    <Text style={styles.gridLabel}>{tile.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Campaigning Status</Text>

              <View style={styles.statusCardsRow}>
                {campaignCards.map((card, index) => (
                  <View
                    key={card.subtitle}
                    style={[
                      styles.statusCard,
                      index === 0 ? styles.statusCardLeft : styles.statusCardRight,
                      { backgroundColor: card.background },
                    ]}
                  >
                    <View style={styles.statusCardText}>
                      <View style={styles.statusTitleRow}>
                        <Text style={styles.statusNumber}>{card.title}</Text>
                        <Text style={styles.statusSubtitle}>{card.subtitle}</Text>
                      </View>
                      <Text style={styles.statusFooter}>{card.footer}</Text>
                    </View>

                    <View style={styles.statusIconWrap}>
                      {renderIcon(card.kind, card.icon, '#4C4C4C', 30)}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.poweredBy}>Powered By</Text>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default DashboardScreen;
