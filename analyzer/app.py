import io
import tempfile
from pathlib import Path

import cv2
import numpy as np
import streamlit as st
from PIL import Image
from skimage.metrics import structural_similarity as ssim

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="PrivaShield — Privacy Analyzer",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Dark theme CSS matching PrivaShield palette ───────────────────────────────
st.markdown(
    """
    <style>
    /* Base */
    html, body, [data-testid="stAppViewContainer"] {
        background-color: #05060B !important;
        color: #FFFFFF;
    }
    [data-testid="stHeader"] { background: #05060B !important; }
    [data-testid="stSidebar"] { background: #0A0B12 !important; }

    /* Remove default padding */
    .block-container { padding-top: 2rem; padding-bottom: 2rem; }

    /* Hero banner */
    .hero {
        background: linear-gradient(135deg, #0A0B12 0%, #0D1520 100%);
        border: 1px solid rgba(14,246,255,0.18);
        border-radius: 20px;
        padding: 2.2rem 2.5rem;
        margin-bottom: 2rem;
        text-align: center;
    }
    .hero h1 {
        font-size: 2.2rem;
        font-weight: 900;
        color: #FFFFFF;
        margin: 0 0 0.4rem 0;
        letter-spacing: -0.5px;
    }
    .hero span.accent { color: #0EF6FF; }
    .hero p {
        color: #9AA3B8;
        font-size: 1rem;
        margin: 0;
    }

    /* Upload zone */
    [data-testid="stFileUploader"] {
        background: #0A0B12;
        border: 1.5px dashed rgba(14,246,255,0.35) !important;
        border-radius: 14px;
        padding: 0.5rem;
    }
    [data-testid="stFileUploader"]:hover {
        border-color: rgba(14,246,255,0.7) !important;
    }
    [data-testid="stFileUploader"] label { color: #9AA3B8 !important; }

    /* Metric cards */
    .metric-row { display: flex; gap: 1rem; margin: 1.5rem 0; }
    .metric-card {
        flex: 1;
        background: #0A0B12;
        border: 1px solid rgba(14,246,255,0.15);
        border-radius: 16px;
        padding: 1.4rem 1.2rem;
        text-align: center;
        position: relative;
    }
    .metric-card .label {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #0EF6FF;
        margin-bottom: 0.5rem;
    }
    .metric-card .value {
        font-size: 2rem;
        font-weight: 900;
        color: #FFFFFF;
        line-height: 1;
    }
    .metric-card .unit {
        font-size: 0.75rem;
        color: #9AA3B8;
        margin-top: 0.3rem;
    }
    .metric-card .tooltip {
        font-size: 0.72rem;
        color: #9AA3B8;
        margin-top: 0.6rem;
        line-height: 1.4;
        border-top: 1px solid rgba(255,255,255,0.06);
        padding-top: 0.6rem;
    }
    .badge-good  { border-color: rgba(14,246,255,0.5) !important; }
    .badge-warn  { border-color: rgba(255,200,50,0.5) !important; }
    .badge-great { border-color: rgba(0,220,120,0.5) !important; }

    /* Section headers */
    .section-head {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 1.8px;
        text-transform: uppercase;
        color: #0EF6FF;
        margin: 2rem 0 0.8rem 0;
    }

    /* Analyze button */
    div[data-testid="stButton"] button {
        background: linear-gradient(90deg, #0EF6FF 0%, #008EFF 100%);
        color: #05060B;
        font-weight: 800;
        font-size: 1rem;
        border: none;
        border-radius: 14px;
        padding: 0.8rem 2.5rem;
        width: 100%;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    div[data-testid="stButton"] button:hover { opacity: 0.88; }

    /* Download buttons */
    div[data-testid="stDownloadButton"] button {
        background: rgba(14,246,255,0.08) !important;
        border: 1px solid rgba(14,246,255,0.3) !important;
        color: #0EF6FF !important;
        border-radius: 10px !important;
        font-size: 0.8rem !important;
        font-weight: 600 !important;
        padding: 0.4rem 1rem !important;
    }
    div[data-testid="stDownloadButton"] button:hover {
        background: rgba(14,246,255,0.18) !important;
    }

    /* Divider */
    hr { border-color: rgba(255,255,255,0.06) !important; }

    /* Expander */
    [data-testid="stExpander"] {
        background: #0A0B12 !important;
        border: 1px solid rgba(14,246,255,0.12) !important;
        border-radius: 14px !important;
    }
    [data-testid="stExpander"] summary { color: #FFFFFF !important; font-weight: 600; }

    /* Image captions */
    [data-testid="stImage"] p {
        color: #9AA3B8 !important;
        font-size: 0.75rem !important;
        text-align: center !important;
        margin-top: 4px;
    }

    /* Success / warning banners */
    [data-testid="stAlert"] { border-radius: 12px !important; }

    /* Spinner */
    [data-testid="stSpinner"] { color: #0EF6FF !important; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_image_cv(uploaded) -> np.ndarray:
    """Load an uploaded file into a BGR OpenCV array."""
    data = np.frombuffer(uploaded.read(), np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Could not decode image: {uploaded.name}")
    return img


def pil_from_cv(img_bgr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))


def img_to_bytes(pil_img: Image.Image) -> bytes:
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()


def compute_metrics(orig: np.ndarray, prot: np.ndarray):
    """Return (mse, psnr, ssim_score, ssim_diff_map)."""
    orig_f = orig.astype(np.float64)
    prot_f = prot.astype(np.float64)

    mse = float(np.mean((orig_f - prot_f) ** 2))
    psnr = float("inf") if mse == 0 else 10 * np.log10(255.0 ** 2 / mse)

    orig_gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
    prot_gray = cv2.cvtColor(prot, cv2.COLOR_BGR2GRAY)
    ssim_score, ssim_map = ssim(orig_gray, prot_gray, full=True, data_range=255)

    return mse, psnr, ssim_score, ssim_map


def build_visuals(orig: np.ndarray, prot: np.ndarray, ssim_map: np.ndarray, amp: int = 8):
    """Return dict of visual outputs as BGR arrays."""
    diff = cv2.absdiff(orig, prot)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

    # Amplified diff
    amp_diff = np.clip(diff_gray.astype(np.float32) * amp, 0, 255).astype(np.uint8)
    amp_diff_bgr = cv2.cvtColor(amp_diff, cv2.COLOR_GRAY2BGR)

    # SSIM heatmap
    ssim_vis = (1.0 - ssim_map)  # invert: high = more different
    ssim_vis = np.clip(ssim_vis, 0, 1)
    ssim_8 = (ssim_vis * 255).astype(np.uint8)
    ssim_heat = cv2.applyColorMap(ssim_8, cv2.COLORMAP_JET)

    # Contour overlay
    _, thresh = cv2.threshold(diff_gray, 15, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour_img = orig.copy()
    cv2.drawContours(contour_img, contours, -1, (0, 0, 255), 1)

    return {
        "Amplified Diff": amp_diff_bgr,
        "SSIM Heatmap": ssim_heat,
        "Contour Overlay": contour_img,
    }


def build_strip(orig, prot, visuals: dict) -> np.ndarray:
    """Build a horizontal 5-panel comparison strip."""
    target_h = 300
    panels = [orig, prot] + list(visuals.values())
    labels = ["Original", "Noise-Protected", "Amplified Diff", "SSIM Heatmap", "Contour Overlay"]

    resized = []
    for img in panels:
        h, w = img.shape[:2]
        scale = target_h / h
        new_w = int(w * scale)
        resized.append(cv2.resize(img, (new_w, target_h)))

    label_h = 32
    strip_w = sum(r.shape[1] for r in resized)
    strip = np.zeros((target_h + label_h, strip_w, 3), dtype=np.uint8)
    strip[:] = (10, 6, 5)  # dark bg

    x = 0
    for img, label in zip(resized, labels):
        w = img.shape[1]
        strip[label_h:, x : x + w] = img
        text_x = x + w // 2 - len(label) * 4
        cv2.putText(strip, label, (text_x, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (14, 246, 255), 1, cv2.LINE_AA)
        if x + w < strip_w:
            strip[:, x + w - 1] = (30, 30, 40)
        x += w

    return strip


def protection_verdict(mse: float, psnr: float, ssim_score: float) -> tuple[str, str, str]:
    """Return (label, css_class, description)."""
    if ssim_score < 0.6:
        return "Strong", "badge-great", "High protection — AI models will struggle to identify subjects."
    elif ssim_score < 0.85:
        return "Moderate", "badge-warn", "Decent protection — consider increasing noise intensity."
    else:
        return "Weak", "badge-good", "Low protection — the images are still very similar."


# ── UI ────────────────────────────────────────────────────────────────────────

st.markdown(
    """
    <div class="hero">
        <h1>🛡️ Privacy <span class="accent">Protection Analyzer</span></h1>
        <p>Compare an original image against its noise-protected version to measure how well it resists AI recognition.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

# Upload columns
col_orig, col_prot = st.columns(2, gap="large")
with col_orig:
    st.markdown('<p class="section-head">Original Image</p>', unsafe_allow_html=True)
    orig_file = st.file_uploader(
        "Upload the unprotected original",
        type=["png", "jpg", "jpeg", "webp"],
        key="original",
        label_visibility="collapsed",
    )
    if orig_file:
        st.image(orig_file, use_container_width=True, caption="Original")

with col_prot:
    st.markdown('<p class="section-head">Noise-Protected Image</p>', unsafe_allow_html=True)
    prot_file = st.file_uploader(
        "Upload the PrivaShield-protected version",
        type=["png", "jpg", "jpeg", "webp"],
        key="protected",
        label_visibility="collapsed",
    )
    if prot_file:
        st.image(prot_file, use_container_width=True, caption="Noise-Protected")

st.markdown("<br>", unsafe_allow_html=True)

_, btn_col, _ = st.columns([1, 2, 1])
with btn_col:
    analyze = st.button("🔬  Analyze Privacy Protection", use_container_width=True)

# ── Analysis ──────────────────────────────────────────────────────────────────
if analyze:
    if not orig_file or not prot_file:
        st.warning("⚠️  Please upload both images before analyzing.")
        st.stop()

    with st.spinner("Running analysis…"):
        try:
            orig_file.seek(0)
            prot_file.seek(0)
            orig_cv = load_image_cv(orig_file)
            prot_cv = load_image_cv(prot_file)

            # Resize protected to match original if needed
            if orig_cv.shape[:2] != prot_cv.shape[:2]:
                h, w = orig_cv.shape[:2]
                prot_cv = cv2.resize(prot_cv, (w, h), interpolation=cv2.INTER_LANCZOS4)
                st.info("ℹ️  Protected image was resized to match the original dimensions.")

            mse, psnr, ssim_score, ssim_map = compute_metrics(orig_cv, prot_cv)
            visuals = build_visuals(orig_cv, prot_cv, ssim_map)
            strip = build_strip(orig_cv, prot_cv, visuals)

        except Exception as exc:
            st.error(f"❌  Error processing images: {exc}")
            st.stop()

    # ── Verdict banner ──
    verdict_label, verdict_cls, verdict_desc = protection_verdict(mse, psnr, ssim_score)
    st.markdown(
        f"""
        <div class="metric-card {verdict_cls}" style="margin: 1.5rem 0; padding: 1rem 1.5rem; text-align:left; display:flex; align-items:center; gap:1rem;">
            <div>
                <div class="label">Protection Verdict</div>
                <div class="value" style="font-size:1.5rem">{verdict_label} Privacy Masking</div>
                <div class="tooltip" style="border-top:none; padding-top:0.2rem">{verdict_desc}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Metric cards ──
    st.markdown('<p class="section-head">Quality Metrics</p>', unsafe_allow_html=True)
    st.markdown(
        f"""
        <div class="metric-row">
            <div class="metric-card">
                <div class="label">MSE</div>
                <div class="value">{mse:.1f}</div>
                <div class="unit">Mean Squared Error</div>
                <div class="tooltip">Measures average pixel-level difference. Higher = more noise injected and stronger protection.</div>
            </div>
            <div class="metric-card">
                <div class="label">PSNR</div>
                <div class="value">{'∞' if psnr == float('inf') else f'{psnr:.1f}'}</div>
                <div class="unit">dB — Peak Signal-to-Noise Ratio</div>
                <div class="tooltip">Lower PSNR means the protected image deviates more from the original — desirable for privacy.</div>
            </div>
            <div class="metric-card">
                <div class="label">SSIM</div>
                <div class="value">{ssim_score:.4f}</div>
                <div class="unit">Structural Similarity Index</div>
                <div class="tooltip">Ranges 0–1. Lower SSIM means stronger structural distortion — harder for AI to recognize the subject.</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Comparison strip ──
    st.markdown('<p class="section-head">Comparison Strip</p>', unsafe_allow_html=True)
    strip_pil = pil_from_cv(strip)
    st.image(strip_pil, use_container_width=True, caption="Original · Protected · Amplified Diff · SSIM Heatmap · Contour Overlay")

    dl_col, _ = st.columns([1, 3])
    with dl_col:
        st.download_button(
            "⬇  Download Strip",
            data=img_to_bytes(strip_pil),
            file_name="privashield_comparison_strip.png",
            mime="image/png",
        )

    # ── Individual maps ──
    st.markdown('<p class="section-head">Visual Analysis Maps</p>', unsafe_allow_html=True)

    map_descriptions = {
        "Amplified Diff": (
            "Absolute pixel differences amplified 8× to reveal subtle noise patterns. "
            "Bright regions indicate where the adversarial perturbation is strongest."
        ),
        "SSIM Heatmap": (
            "Structural similarity loss visualized with a Jet colormap. "
            "Red/yellow regions have the highest structural distortion — AI faces most difficulty here."
        ),
        "Contour Overlay": (
            "Red contours mark the boundaries of changed pixel regions. "
            "Dense contours indicate widespread protection coverage across the image."
        ),
    }

    for name, img_cv in visuals.items():
        with st.expander(f"🔍  {name}", expanded=True):
            pil_img = pil_from_cv(img_cv)
            left, right = st.columns([3, 1])
            with left:
                st.image(pil_img, use_container_width=True, caption=name)
            with right:
                st.markdown(
                    f"<p style='color:#9AA3B8; font-size:0.82rem; line-height:1.6; margin-top:0.5rem'>{map_descriptions[name]}</p>",
                    unsafe_allow_html=True,
                )
                st.download_button(
                    f"⬇  Download",
                    data=img_to_bytes(pil_img),
                    file_name=f"privashield_{name.lower().replace(' ','_')}.png",
                    mime="image/png",
                    key=f"dl_{name}",
                )

    st.markdown("---")
    st.markdown(
        "<p style='text-align:center; color:#9AA3B8; font-size:0.75rem'>PrivaShield Privacy Protection Analyzer · Powered by OpenCV & scikit-image</p>",
        unsafe_allow_html=True,
    )

elif not orig_file and not prot_file:
    st.markdown(
        """
        <div style="text-align:center; padding: 3rem 0; color:#9AA3B8;">
            <div style="font-size:3rem; margin-bottom:1rem">🔬</div>
            <p style="font-size:1rem; font-weight:600; color:#FFFFFF; margin-bottom:0.4rem">Upload both images to begin analysis</p>
            <p style="font-size:0.85rem">Use an original photo and its PrivaShield-protected version to measure protection quality.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
