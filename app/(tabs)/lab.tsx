import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getApiBaseUrl } from '@/constants/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  mse: number;
  psnr: number | null;
  ssim: number;
  verdict: string;
  verdictLevel: 'great' | 'warn' | 'low';
  strip: string;
  ampDiff: string;
  ssimHeatmap: string;
  contourOverlay: string;
}

// ── Web-only file input helper ────────────────────────────────────────────────

function useFileInput(onPick: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const open = () => {
    if (Platform.OS !== 'web') return;
    if (!inputRef.current) {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept = 'image/png,image/jpeg,image/webp';
      el.style.display = 'none';
      el.onchange = () => { if (el.files?.[0]) onPick(el.files[0]); };
      document.body.appendChild(el);
      inputRef.current = el;
    }
    inputRef.current.value = '';
    inputRef.current.click();
  };

  return open;
}

// ── Analyzer component ────────────────────────────────────────────────────────

function PrivacyAnalyzer() {
  const [origFile, setOrigFile] = useState<File | null>(null);
  const [protFile, setProtFile] = useState<File | null>(null);
  const [origPreview, setOrigPreview] = useState<string | null>(null);
  const [protPreview, setProtPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);

  const pickOrig = useFileInput((f) => {
    setOrigFile(f);
    setOrigPreview(URL.createObjectURL(f));
    setResult(null);
  });

  const pickProt = useFileInput((f) => {
    setProtFile(f);
    setProtPreview(URL.createObjectURL(f));
    setResult(null);
  });

  const analyze = async () => {
    if (!origFile || !protFile) {
      setError('Upload both images first.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('original', origFile);
      form.append('protected', protFile);
      const res = await fetch(`${getApiBaseUrl()}/api/analyze`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (b64: string, name: string) => {
    if (Platform.OS !== 'web') return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${b64}`;
    a.download = name;
    a.click();
  };

  const verdictColors: Record<string, string> = {
    great: '#00DC78',
    warn: '#FFC832',
    low: '#FF5050',
  };

  const mapLabels: Record<string, { label: string; tip: string }> = {
    ampDiff: {
      label: 'Amplified Diff',
      tip: 'Pixel differences amplified 8×. Bright = stronger noise.',
    },
    ssimHeatmap: {
      label: 'SSIM Heatmap',
      tip: 'Red/yellow = most structural distortion — hardest for AI.',
    },
    contourOverlay: {
      label: 'Contour Overlay',
      tip: 'Red outlines mark changed pixel regions.',
    },
  };

  // Native: no file API — show open-in-browser prompt
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.analyzerNative}>
        <Text style={styles.analyzerNativeText}>
          The analyzer uses file uploads — open PrivaShield on web or tap below.
        </Text>
        <TouchableOpacity
          style={styles.openButton}
          onPress={() => Linking.openURL('http://localhost:8080')}
        >
          <Text style={styles.openButtonText}>Open Standalone Analyzer ↗</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.analyzer}>
      {/* Upload row */}
      <View style={styles.uploadRow}>
        <TouchableOpacity style={styles.uploadBox} onPress={pickOrig} activeOpacity={0.8}>
          {origPreview ? (
            <Image source={{ uri: origPreview }} style={styles.uploadPreview} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadLabel}>Original</Text>
              <Text style={styles.uploadHint}>Tap to upload</Text>
            </View>
          )}
          {origPreview && (
            <View style={styles.uploadOverlay}>
              <Text style={styles.uploadOverlayText}>Original ✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBox} onPress={pickProt} activeOpacity={0.8}>
          {protPreview ? (
            <Image source={{ uri: protPreview }} style={styles.uploadPreview} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>🛡️</Text>
              <Text style={styles.uploadLabel}>Protected</Text>
              <Text style={styles.uploadHint}>Tap to upload</Text>
            </View>
          )}
          {protPreview && (
            <View style={styles.uploadOverlay}>
              <Text style={styles.uploadOverlayText}>Protected ✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Analyze button */}
      <TouchableOpacity
        style={[styles.analyzeBtn, (!origFile || !protFile || loading) && styles.analyzeBtnDisabled]}
        onPress={analyze}
        activeOpacity={0.85}
        disabled={!origFile || !protFile || loading}
      >
        {loading ? (
          <ActivityIndicator color="#05060B" size="small" />
        ) : (
          <Text style={styles.analyzeBtnText}>🔬  Analyze Privacy Protection</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.results}>
          {/* Verdict */}
          <View style={[styles.verdictCard, { borderColor: verdictColors[result.verdictLevel] + '80' }]}>
            <Text style={[styles.verdictLabel, { color: verdictColors[result.verdictLevel] }]}>
              {result.verdict} Privacy Masking
            </Text>
            <Text style={styles.verdictDesc}>
              {result.verdictLevel === 'great'
                ? 'High protection — AI models will struggle to identify subjects.'
                : result.verdictLevel === 'warn'
                ? 'Decent protection — consider increasing noise intensity.'
                : 'Low protection — the images are still very similar.'}
            </Text>
          </View>

          {/* Metric cards */}
          <View style={styles.metricRow}>
            {[
              { key: 'MSE', val: result.mse.toFixed(1), unit: 'Mean Squared Error', tip: 'Higher = more noise injected.' },
              { key: 'PSNR', val: result.psnr === null ? '∞' : result.psnr.toFixed(1), unit: 'dB Signal-to-Noise', tip: 'Lower dB = stronger masking.' },
              { key: 'SSIM', val: result.ssim.toFixed(3), unit: 'Structural Similarity', tip: 'Closer to 0 = harder for AI.' },
            ].map((m) => (
              <View key={m.key} style={styles.metricCard}>
                <Text style={styles.metricKey}>{m.key}</Text>
                <Text style={styles.metricVal}>{m.val}</Text>
                <Text style={styles.metricUnit}>{m.unit}</Text>
                <Text style={styles.metricTip}>{m.tip}</Text>
              </View>
            ))}
          </View>

          {/* Comparison strip */}
          <Text style={styles.sectionLabel}>COMPARISON STRIP</Text>
          <View style={styles.stripCard}>
            <Image
              source={{ uri: `data:image/png;base64,${result.strip}` }}
              style={styles.stripImage}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity
            style={styles.dlBtn}
            onPress={() => downloadImage(result.strip, 'privashield_comparison_strip.png')}
          >
            <Text style={styles.dlBtnText}>⬇  Download Strip</Text>
          </TouchableOpacity>

          {/* Individual maps */}
          <Text style={styles.sectionLabel}>VISUAL MAPS</Text>
          {(['ampDiff', 'ssimHeatmap', 'contourOverlay'] as const).map((key) => {
            const { label, tip } = mapLabels[key];
            const isExpanded = expandedMap === key;
            return (
              <View key={key} style={styles.mapCard}>
                <TouchableOpacity
                  style={styles.mapHeader}
                  onPress={() => setExpandedMap(isExpanded ? null : key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mapTitle}>🔍  {label}</Text>
                  <Text style={styles.mapChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.mapBody}>
                    <Image
                      source={{ uri: `data:image/png;base64,${result[key]}` }}
                      style={styles.mapImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.mapTip}>{tip}</Text>
                    <TouchableOpacity
                      style={styles.dlBtn}
                      onPress={() => downloadImage(result[key], `privashield_${key}.png`)}
                    >
                      <Text style={styles.dlBtnText}>⬇  Download</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function LabScreen() {
  const [metadataScrub, setMetadataScrub] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [batchMode, setBatchMode] = useState(true);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Security Lab</Text>
          <Text style={styles.subtitle}>Run advanced scans and configure your protection stack.</Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statLabel}>Scan health</Text>
            <Text style={styles.statValue}>98%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Batch jobs</Text>
            <Text style={styles.statValue}>4 queued</Text>
          </View>
        </View>

        {/* ── Privacy Analyzer panel ── */}
        <View style={styles.panel}>
          <View style={styles.analyzerTitleRow}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
            <Text style={styles.panelTitle}>Privacy Protection Analyzer</Text>
          </View>
          <Text style={styles.panelText}>
            Upload an original and a noise-protected image to measure MSE, PSNR &amp; SSIM — and
            visualise exactly where the adversarial noise is working.
          </Text>

          <TouchableOpacity
            style={[styles.quickButton, analyzerOpen && styles.quickButtonOutline]}
            activeOpacity={0.85}
            onPress={() => setAnalyzerOpen((v) => !v)}
          >
            <Text style={[styles.quickButtonText, analyzerOpen && styles.quickButtonTextOutline]}>
              {analyzerOpen ? '✕  Close Analyzer' : '🔬  Open Analyzer'}
            </Text>
          </TouchableOpacity>

          {analyzerOpen && <PrivacyAnalyzer />}
        </View>

        {/* ── Protection tools ── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Protection tools</Text>
          <Text style={styles.panelText}>Enable or disable automated safeguards for future uploads.</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Automatic scan</Text>
            <Switch value={autoScan} onValueChange={setAutoScan} thumbColor={autoScan ? '#0EF6FF' : '#283041'} trackColor={{ false: '#191C28', true: '#0EF6FF' }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Metadata scrub</Text>
            <Switch value={metadataScrub} onValueChange={setMetadataScrub} thumbColor={metadataScrub ? '#0EF6FF' : '#283041'} trackColor={{ false: '#191C28', true: '#0EF6FF' }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Batch mode</Text>
            <Switch value={batchMode} onValueChange={setBatchMode} thumbColor={batchMode ? '#0EF6FF' : '#283041'} trackColor={{ false: '#191C28', true: '#0EF6FF' }} />
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Quick actions</Text>
          <TouchableOpacity style={styles.quickButton} activeOpacity={0.9}>
            <Text style={styles.quickButtonText}>Run vulnerability scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} activeOpacity={0.9}>
            <Text style={styles.quickButtonText}>Batch protect all</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05060B' },
  container: { padding: 20, gap: 18, paddingBottom: 40 },

  headerSection: { gap: 8 },
  title: { fontSize: 28, color: '#FFFFFF', fontWeight: '800' },
  subtitle: { color: '#9AA3B8', fontSize: 14, lineHeight: 20 },

  metricGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: 20, backgroundColor: '#0B101D',
    padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statCardAccent: { borderColor: '#0EF6FF' },
  statLabel: { color: '#9AA3B8', fontSize: 13, marginBottom: 12 },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },

  panel: {
    borderRadius: 24, backgroundColor: '#090B13',
    borderWidth: 1, borderColor: 'rgba(14,246,255,0.08)',
    padding: 18, gap: 14,
  },
  panelTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  panelText: { color: '#9AA3B8', fontSize: 13, lineHeight: 20 },
  panelLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  analyzerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newBadge: {
    backgroundColor: 'rgba(14,246,255,0.12)',
    borderRadius: 4, borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.3)',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  newBadgeText: { color: '#0EF6FF', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },

  quickButton: {
    borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#0EF6FF',
  },
  quickButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(14,246,255,0.4)',
  },
  quickButtonText: { color: '#05060B', fontWeight: '800', fontSize: 14 },
  quickButtonTextOutline: { color: '#0EF6FF' },

  // ── Analyzer ──
  analyzer: { gap: 14 },
  analyzerNative: { gap: 12, alignItems: 'center', paddingVertical: 8 },
  analyzerNativeText: { color: '#9AA3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  openButton: {
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(14,246,255,0.4)',
  },
  openButtonText: { color: '#0EF6FF', fontWeight: '700', fontSize: 13 },

  uploadRow: { flexDirection: 'row', gap: 10 },
  uploadBox: {
    flex: 1, aspectRatio: 1, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(14,246,255,0.25)',
    borderStyle: 'dashed', overflow: 'hidden',
    backgroundColor: '#07080F',
  },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadIcon: { fontSize: 26 },
  uploadLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  uploadHint: { color: '#9AA3B8', fontSize: 11 },
  uploadPreview: { width: '100%', height: '100%' },
  uploadOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(14,246,255,0.85)',
    paddingVertical: 4, alignItems: 'center',
  },
  uploadOverlayText: { color: '#05060B', fontSize: 11, fontWeight: '700' },

  analyzeBtn: {
    borderRadius: 16, paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#0EF6FF',
  },
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText: { color: '#05060B', fontWeight: '800', fontSize: 14 },

  errorBox: {
    backgroundColor: 'rgba(255,80,80,0.1)',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)',
  },
  errorText: { color: '#FF6060', fontSize: 13 },

  results: { gap: 14 },

  verdictCard: {
    borderRadius: 14, borderWidth: 1,
    backgroundColor: '#07080F',
    padding: 14, gap: 6,
  },
  verdictLabel: { fontSize: 15, fontWeight: '800' },
  verdictDesc: { color: '#9AA3B8', fontSize: 13, lineHeight: 18 },

  metricRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1, backgroundColor: '#07080F',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.12)',
    padding: 10, gap: 3, alignItems: 'center',
  },
  metricKey: { color: '#0EF6FF', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  metricVal: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  metricUnit: { color: '#9AA3B8', fontSize: 9, textAlign: 'center' },
  metricTip: { color: '#9AA3B8', fontSize: 9, textAlign: 'center', lineHeight: 13, marginTop: 3 },

  sectionLabel: {
    color: '#0EF6FF', fontSize: 9, fontWeight: '800',
    letterSpacing: 1.8, marginTop: 4,
  },
  stripCard: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(14,246,255,0.12)',
    backgroundColor: '#07080F',
  },
  stripImage: { width: '100%', height: 180 },

  dlBtn: {
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.3)',
    backgroundColor: 'rgba(14,246,255,0.06)',
  },
  dlBtnText: { color: '#0EF6FF', fontWeight: '700', fontSize: 12 },

  mapCard: {
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.1)',
    backgroundColor: '#07080F', overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  mapTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  mapChevron: { color: '#0EF6FF', fontSize: 12 },
  mapBody: { padding: 14, paddingTop: 0, gap: 10 },
  mapImage: { width: '100%', height: 200, borderRadius: 8 },
  mapTip: { color: '#9AA3B8', fontSize: 12, lineHeight: 18 },
});
