import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def enhance_presentation():
    template_path = r"j:\electron\wingridFYP\wingrid\public\FILES\UG SLIDE TEMPLATE.pptx"
    logo_path = r"j:\electron\wingridFYP\wingrid\public\wingrid.png"
    tv_icon_path = r"j:\electron\wingridFYP\wingrid\public\smart-tv.png"
    countdown_icon_path = r"j:\electron\wingridFYP\wingrid\public\countdown.png"
    caption_icon_path = r"j:\electron\wingridFYP\wingrid\public\caption.png"
    messages_icon_path = r"j:\electron\wingridFYP\wingrid\public\messages.png"
    update_icon_path = r"j:\electron\wingridFYP\wingrid\public\update.png"
    
    prs = Presentation(template_path)
    
    # Colors
    UG_NAVY = RGBColor(0, 51, 102)       # University of Ghana Navy
    OCEAN_BLUE = RGBColor(0, 96, 137)     # Wingrid Ocean Blue Accent (#006089)
    DARK_TEXT = RGBColor(30, 35, 42)      # Charcoal Text
    MUTED_TEXT = RGBColor(90, 95, 105)    # Slate Muted Text
    WHITE = RGBColor(255, 255, 255)
    LIGHT_BG = RGBColor(245, 247, 250)    # Soft Card Background
    CARD_BORDER = RGBColor(215, 222, 232) # Soft Border
    CARD_BG_ALT = RGBColor(238, 243, 249) # Highlight Card Background
    ACCENT_EMERALD = RGBColor(16, 140, 90) # Green checkmark/accent
    ACCENT_RED = RGBColor(190, 40, 40)    # Red warning/cross
    
    # Helper to clean content placeholder but preserve master slide title & date/numbers
    def reset_slide_content(slide):
        shapes_to_remove = []
        for shape in slide.shapes:
            if shape.name.startswith("Content") or (shape.is_placeholder and shape.placeholder_format.idx in [1, 2, 7]):
                shape.text_frame.text = ""
            elif shape.name.startswith("Rectangle") or shape.name.startswith("CustomCard") or shape.name.startswith("CustomBox"):
                shapes_to_remove.append(shape)
        for s in shapes_to_remove:
            sp = s._element
            sp.getparent().remove(sp)

    # Helper to set slide title
    def set_title(slide, title_text):
        for shape in slide.shapes:
            if shape.has_text_frame and (shape.name.startswith("Title") or (shape.is_placeholder and shape.placeholder_format.idx == 0)):
                shape.text_frame.text = title_text
                for p in shape.text_frame.paragraphs:
                    p.font.name = "Arial"
                    p.font.size = Pt(22)
                    p.font.bold = True
                    p.font.color.rgb = UG_NAVY

    # Helper to add a stylized rounded card
    def add_card(slide, left, top, width, height, bg_color=LIGHT_BG, border_color=CARD_BORDER):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.name = "CustomCard"
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
        return shape

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
    s1 = prs.slides[0]
    reset_slide_content(s1)
    for shape in s1.shapes:
        if shape.name == "Title 1" or (shape.is_placeholder and shape.placeholder_format.idx == 0):
            shape.text_frame.text = "FINAL YEAR PROJECT PRESENTATION & DEMO"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Arial"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = UG_NAVY
        elif shape.name == "Subtitle 2" or (shape.is_placeholder and shape.placeholder_format.idx == 1):
            tf = shape.text_frame
            tf.word_wrap = True
            tf.text = ""
            
            p0 = tf.paragraphs[0]
            p0.text = "WINGRID\n"
            p0.font.name = "Arial"
            p0.font.size = Pt(26)
            p0.font.bold = True
            p0.font.color.rgb = OCEAN_BLUE
            
            p1 = tf.add_paragraph()
            p1.text = "A Multi-Window Presentation Orchestration and Context-Aware Projection System for Live Display Environments\n"
            p1.font.name = "Arial"
            p1.font.size = Pt(14)
            p1.font.bold = True
            p1.font.color.rgb = DARK_TEXT
            
            p2 = tf.add_paragraph()
            p2.text = "Presented by: [Student Name]  |  ID: [Student ID]\nSupervisor: [Supervisor Name]\nDepartment of Computer Science, University of Ghana\nOctober 2026"
            p2.font.name = "Arial"
            p2.font.size = Pt(11.5)
            p2.font.color.rgb = MUTED_TEXT

    # Add Wingrid Logo on Title Slide
    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(1.1), Inches(1.8), width=Inches(1.8))

    # -------------------------------------------------------------
    # SLIDE 2: Presentation Outline (Visual 2-Column Cards)
    # -------------------------------------------------------------
    s2 = prs.slides[1]
    reset_slide_content(s2)
    set_title(s2, "OUTLINE OF PRESENTATION")
    
    outline_items = [
        ("01", "Introduction & Motivation", "Live multi-source presentations in churches, classrooms & hybrid events."),
        ("02", "Problem Statement", "The 4 core display bottlenecks in modern presentation environments."),
        ("03", "Aims and Specific Objectives", "High-performance GPU compositor + Real-time AI context intelligence."),
        ("04", "Related Work & Competitive Analysis", "Benchmarking vs Zoom/Teams, OBS Studio, and ProPresenter."),
        ("05", "Proposed Solution & Architecture", "'Two Windows, One Operator' dual-window display separation model."),
        ("06", "Key Technical Subsystems", "WGC capture, 60 FPS GPU pipeline, Groq AI producer & LAN WebRTC."),
        ("07", "System Demonstration Workflow", "Step-by-step panel live demonstration and verification."),
        ("08", "Conclusion & Future Work", "Summary of contributions, scalability, and future research.")
    ]
    
    card_w = Inches(5.65)
    card_h = Inches(1.05)
    col1_left = Inches(0.8)
    col2_left = Inches(6.8)
    row_starts = [Inches(1.5), Inches(2.7), Inches(3.9), Inches(5.1)]
    
    for idx, (num, heading, desc) in enumerate(outline_items):
        col = col1_left if idx < 4 else col2_left
        row = row_starts[idx % 4]
        
        card = add_card(s2, col, row, card_w, card_h, bg_color=CARD_BG_ALT if idx % 2 == 0 else LIGHT_BG)
        tf = card.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.1)
        tf.margin_bottom = Inches(0.1)
        
        p = tf.paragraphs[0]
        p.text = f"{num}.  {heading}"
        p.font.name = "Arial"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = UG_NAVY
        
        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.name = "Arial"
        p_desc.font.size = Pt(10)
        p_desc.font.color.rgb = MUTED_TEXT

    # -------------------------------------------------------------
    # SLIDE 3: Problem Statement (4 Structured Problem Cards)
    # -------------------------------------------------------------
    s3 = prs.slides[2]
    reset_slide_content(s3)
    set_title(s3, "Problem Statement: The 4 Core Bottlenecks")
    
    problems = [
        ("1. Single-Source Sharing Bottleneck", 
         "Standard tools (Zoom, Teams, Projectors) restrict sharing to one window or force full-screen sharing.\n\nPresenting 2 or more applications simultaneously (e.g. Slides + Bible + Code) is impossible without awkward manual resizing."),
        ("2. Display Mode Conflicts & Flickering", 
         "Different software packages require different Windows display modes (Extended vs. Duplicate).\n\nRepeatedly pressing Win+P during live presentations causes screen flickering, resolution drops, and embarrassing delays."),
        ("3. Privacy & Desktop Clutter Exposure", 
         "Sharing the full desktop leaks private notifications (WhatsApp, emails), desktop files, taskbars, and personal background apps.\n\nUndermines presenter privacy and professional presentation quality."),
        ("4. Manual Production Overhead", 
         "Displaying supporting context (scriptures, speaker lower-thirds, timers, quotes) requires dedicated crew.\n\nManually typing and swapping scenes in complex OBS setups introduces human error and high operational cost.")
    ]
    
    card_w = Inches(5.65)
    card_h = Inches(2.25)
    
    for idx, (title_text, body_text) in enumerate(problems):
        col = col1_left if idx in [0, 2] else col2_left
        row = Inches(1.5) if idx in [0, 1] else Inches(4.0)
        
        card = add_card(s3, col, row, card_w, card_h, bg_color=LIGHT_BG, border_color=RGBColor(210, 80, 80) if idx==2 else CARD_BORDER)
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.15)
        
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Arial"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = RGBColor(160, 30, 30) if idx==2 else UG_NAVY
        p.space_after = Pt(6)
        
        p_body = tf.add_paragraph()
        p_body.text = body_text
        p_body.font.name = "Arial"
        p_body.font.size = Pt(10.5)
        p_body.font.color.rgb = DARK_TEXT

    # -------------------------------------------------------------
    # SLIDE 4: Aims and Objectives (Aim Banner + 4 Goal Cards)
    # -------------------------------------------------------------
    s4 = prs.slides[3]
    reset_slide_content(s4)
    set_title(s4, "Aims and Specific Objectives")
    
    # Primary Aim Top Banner
    aim_box = add_card(s4, Inches(0.8), Inches(1.5), Inches(11.65), Inches(1.15), bg_color=RGBColor(235, 245, 252), border_color=OCEAN_BLUE)
    tf_aim = aim_box.text_frame
    tf_aim.word_wrap = True
    tf_aim.margin_left = Inches(0.25)
    tf_aim.margin_right = Inches(0.25)
    tf_aim.margin_top = Inches(0.12)
    
    p_aim_label = tf_aim.paragraphs[0]
    p_aim_label.text = "PRIMARY AIM OF THE RESEARCH:"
    p_aim_label.font.name = "Arial"
    p_aim_label.font.size = Pt(11)
    p_aim_label.font.bold = True
    p_aim_label.font.color.rgb = OCEAN_BLUE
    
    p_aim_text = tf_aim.add_paragraph()
    p_aim_text.text = "To design, implement, and evaluate an intelligent desktop presentation system that makes live presentations more professional and significantly smarter by lifting off display bottlenecks and introducing real-time AI context intelligence."
    p_aim_text.font.name = "Arial"
    p_aim_text.font.size = Pt(11.5)
    p_aim_text.font.bold = True
    p_aim_text.font.color.rgb = DARK_TEXT
    
    # 4 Specific Objectives Cards
    objectives = [
        ("Objective 1: GPU Video Pipeline", "Develop a GPU-accelerated window capture pipeline with in-flight request coalescing for 30-60 FPS smooth rendering with <8% CPU."),
        ("Objective 2: Dual-Window Model", "Engineer a 'Two Windows, One Operator' model separating the operator's control studio from the frameless secondary audience projector."),
        ("Objective 3: Real-Time AI Context", "Integrate continuous speech-to-context intelligence (AssemblyAI + Groq Llama 3.1) extracting broadcast cards in ~200ms."),
        ("Objective 4: Network & Security", "Implement zero-configuration local LAN mDNS discovery, permission-gated WebRTC P2P streaming, and Windows DPAPI encryption.")
    ]
    
    card_w = Inches(5.65)
    card_h = Inches(1.75)
    row_top = Inches(2.9)
    row_bottom = Inches(4.85)
    
    for idx, (obj_title, obj_desc) in enumerate(objectives):
        col = col1_left if idx in [0, 2] else col2_left
        row = row_top if idx in [0, 1] else row_bottom
        
        card = add_card(s4, col, row, card_w, card_h, bg_color=LIGHT_BG)
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.12)
        
        p = tf.paragraphs[0]
        p.text = f"✓ {obj_title}"
        p.font.name = "Arial"
        p.font.size = Pt(12.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_EMERALD
        p.space_after = Pt(4)
        
        p_desc = tf.add_paragraph()
        p_desc.text = obj_desc
        p_desc.font.name = "Arial"
        p_desc.font.size = Pt(10.5)
        p_desc.font.color.rgb = DARK_TEXT

    # -------------------------------------------------------------
    # SLIDE 5: Related Work & Competitive Matrix Table
    # -------------------------------------------------------------
    s5 = prs.slides[4]
    reset_slide_content(s5)
    set_title(s5, "Related Work & Competitive Analysis")
    
    # Table layout: 11.65" wide, 4.4" high
    table_shape = s5.shapes.add_table(7, 5, Inches(0.8), Inches(1.5), Inches(11.65), Inches(4.7))
    table = table_shape.table
    table.columns[0].width = Inches(3.65)
    table.columns[1].width = Inches(2.0)
    table.columns[2].width = Inches(2.0)
    table.columns[3].width = Inches(2.0)
    table.columns[4].width = Inches(2.0)
    
    headers = ["Capability / Dimension", "Zoom / Teams", "OBS Studio", "ProPresenter", "WINGRID (Ours)"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = OCEAN_BLUE if c_idx == 4 else UG_NAVY
        for p in cell.text_frame.paragraphs:
            p.font.name = "Arial"
            p.font.size = Pt(11)
            p.font.bold = True
            p.font.color.rgb = WHITE
            p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT
            
    matrix_data = [
        ("Multi-Window Grid Composition", "❌ (1 at a time)", "⚠️ (Manual setup)", "❌ (Slide-only)", "✅ YES (1-Click)"),
        ("Strict Desktop & Notification Isolation", "❌ (Leaks desktop)", "✅ Yes", "✅ Yes", "✅ YES (Native)"),
        ("Zero Windows Display Mode Toggling", "❌ (Win+P req.)", "⚠️ Partial", "⚠️ Partial", "✅ YES (Direct)"),
        ("Real-Time Speech AI Cards (~200ms)", "❌ No", "❌ No", "❌ No", "✅ YES (Llama 3.1)"),
        ("Built-in Timers, Captions & Overlays", "❌ No", "⚠️ Plugins req.", "⚠️ Partial", "✅ YES (Built-in)"),
        ("Zero-Config Operator Learning Curve", "✅ Instant", "❌ Complex/Steep", "⚠️ Medium", "✅ INSTANT")
    ]
    
    for r_idx, row in enumerate(matrix_data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = val
            cell.fill.solid()
            if c_idx == 4:
                cell.fill.fore_color.rgb = RGBColor(230, 245, 255) # Highlight Wingrid column
            else:
                cell.fill.fore_color.rgb = WHITE if r_idx % 2 == 0 else LIGHT_BG
            for p in cell.text_frame.paragraphs:
                p.font.name = "Arial"
                p.font.size = Pt(10.5)
                if c_idx == 4:
                    p.font.bold = True
                    p.font.color.rgb = OCEAN_BLUE
                else:
                    p.font.color.rgb = DARK_TEXT
                p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT

    # -------------------------------------------------------------
    # SLIDE 6: Proposed Solution & System Architecture
    # -------------------------------------------------------------
    s6 = prs.slides[5]
    reset_slide_content(s6)
    set_title(s6, "Proposed Solution & System Architecture")
    
    # Left Column: "Two Windows, One Operator" Architecture Model
    arch_card = add_card(s6, Inches(0.8), Inches(1.5), Inches(5.65), Inches(4.9), bg_color=LIGHT_BG)
    tf_arch = arch_card.text_frame
    tf_arch.word_wrap = True
    tf_arch.margin_left = Inches(0.2)
    tf_arch.margin_right = Inches(0.2)
    tf_arch.margin_top = Inches(0.15)
    
    p = tf_arch.paragraphs[0]
    p.text = "ARCHITECTURE: 'Two Windows, One Operator'"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = UG_NAVY
    p.space_after = Pt(6)
    
    arch_bullets = [
        ("Primary Display (Operator Control Studio):", [
            "Window Picker with live thumbnails and search.",
            "Confidence monitor previewing exact audience layout.",
            "AI Context Carousel, Timer Presets, and 1-click Push/Hide."
        ]),
        ("Secondary Display (Published Audience Canvas):", [
            "Clean, borderless, frameless fullscreen output (PublishedLayout).",
            "Zero desktop icons, notifications, or taskbar exposure.",
            "F5 (Toggle Project), F6 (Blackout Screen), F7 (Freeze Frame)."
        ]),
        ("Inter-Process State Synchronization:", [
            "Ultra-low latency Electron IPC channel (update-projection-state)."
        ])
    ]
    for header, items in arch_bullets:
        p_head = tf_arch.add_paragraph()
        p_head.text = header
        p_head.font.name = "Arial"
        p_head.font.size = Pt(11)
        p_head.font.bold = True
        p_head.font.color.rgb = OCEAN_BLUE
        p_head.space_after = Pt(2)
        for item in items:
            p_item = tf_arch.add_paragraph()
            p_item.text = f"• {item}"
            p_item.font.name = "Arial"
            p_item.font.size = Pt(10)
            p_item.font.color.rgb = DARK_TEXT
            p_item.space_after = Pt(2)

    # Right Column: 3 Core Subsystem Pillar Cards
    subsystems = [
        ("1. Multi-Window Grid Compositor", "Auto-fits 1 to 4 application windows into Single, Dual, Triple, Quad grids with aspect ratio preservation and instant per-window Hide/Show toggles."),
        ("2. Real-Time AI Context Producer (~200ms)", "16kHz PCM audio stream -> AssemblyAI streaming STT -> Groq LPU fast inference (Llama 3.1) extracting scriptures, lower-thirds, quotes -> 1-click Push to Live."),
        ("3. LAN WebRTC P2P Collaboration", "Zero-config mDNS device discovery across local Wi-Fi/Ethernet with permission-gated WebRTC P2P screen sharing (zero cloud bandwidth).")
    ]
    card_h = Inches(1.55)
    for idx, (sub_title, sub_desc) in enumerate(subsystems):
        top_pos = Inches(1.5) + idx * Inches(1.68)
        card = add_card(s6, Inches(6.8), top_pos, Inches(5.65), card_h, bg_color=CARD_BG_ALT)
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.12)
        
        p = tf.paragraphs[0]
        p.text = sub_title
        p.font.name = "Arial"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = OCEAN_BLUE
        p.space_after = Pt(3)
        
        p_desc = tf.add_paragraph()
        p_desc.text = sub_desc
        p_desc.font.name = "Arial"
        p_desc.font.size = Pt(10)
        p_desc.font.color.rgb = DARK_TEXT

    # -------------------------------------------------------------
    # SLIDE 7: Conclusion & Live Demonstration Workflow
    # -------------------------------------------------------------
    s7 = prs.slides[6]
    reset_slide_content(s7)
    set_title(s7, "Conclusion & Live Demonstration")
    
    # Left Card: Live Demo Panel Guide
    demo_card = add_card(s7, Inches(0.8), Inches(1.5), Inches(5.65), Inches(4.9), bg_color=LIGHT_BG)
    tf_demo = demo_card.text_frame
    tf_demo.word_wrap = True
    tf_demo.margin_left = Inches(0.2)
    tf_demo.margin_right = Inches(0.2)
    tf_demo.margin_top = Inches(0.15)
    
    p = tf_demo.paragraphs[0]
    p.text = "LIVE DEMONSTRATION WORKFLOW FOR PANEL"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = UG_NAVY
    p.space_after = Pt(6)
    
    demo_steps = [
        "1. Window Discovery: Launch Wingrid to detect active desktop windows with real-time icons and thumbnails.",
        "2. Multi-Grid Layout: Drag & drop Slide Deck + Bible App + Timer into a Dual/Quad responsive grid.",
        "3. Live Projection: Press F5 to project pristine fullscreen output to secondary monitor (zero desktop clutter).",
        "4. Speech AI Context Extraction: Speak live into microphone -> Groq LLM extracts scripture card in ~200ms -> 1-Click Push to Live audience.",
        "5. Broadcast Controls: Demonstrate F6 (Instant Blackout) and F7 (Freeze Frame).",
        "6. LAN Collaboration: Discover peer Wingrid instance -> Request remote screen via permission-gated WebRTC."
    ]
    for step in demo_steps:
        p_s = tf_demo.add_paragraph()
        p_s.text = step
        p_s.font.name = "Arial"
        p_s.font.size = Pt(10)
        p_s.font.color.rgb = DARK_TEXT
        p_s.space_after = Pt(4)

    # Right Card: Summary of Contributions & Future Scope
    contrib_card = add_card(s7, Inches(6.8), Inches(1.5), Inches(5.65), Inches(4.9), bg_color=RGBColor(235, 245, 252), border_color=OCEAN_BLUE)
    tf_contrib = contrib_card.text_frame
    tf_contrib.word_wrap = True
    tf_contrib.margin_left = Inches(0.2)
    tf_contrib.margin_right = Inches(0.2)
    tf_contrib.margin_top = Inches(0.15)
    
    p = tf_contrib.paragraphs[0]
    p.text = "SUMMARY OF CONTRIBUTIONS & FUTURE WORK"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = OCEAN_BLUE
    p.space_after = Pt(6)
    
    contrib_points = [
        ("Key Contributions:", [
            "Solved the 4 fundamental presentation display bottlenecks.",
            "Engineered high-performance GPU window compositor (60 FPS, <8% CPU).",
            "Delivered zero-configuration 'Two Windows, One Operator' model.",
            "Pioneered real-time speech AI context intelligence (~200ms extraction)."
        ]),
        ("Future Research Directions:", [
            "Multi-speaker voice diarization for panel discussions.",
            "Cross-platform support for macOS (ScreenCaptureKit) & Linux (Wayland).",
            "Automated smart-focus camera tracking for hybrid presentations."
        ])
    ]
    for header, items in contrib_points:
        p_head = tf_contrib.add_paragraph()
        p_head.text = header
        p_head.font.name = "Arial"
        p_head.font.size = Pt(11)
        p_head.font.bold = True
        p_head.font.color.rgb = UG_NAVY
        p_head.space_after = Pt(2)
        for item in items:
            p_item = tf_contrib.add_paragraph()
            p_item.text = f"✓ {item}"
            p_item.font.name = "Arial"
            p_item.font.size = Pt(10)
            p_item.font.color.rgb = DARK_TEXT
            p_item.space_after = Pt(2)

    # -------------------------------------------------------------
    # SLIDE 8: Final Title Slide (Thank You & Q&A)
    # -------------------------------------------------------------
    s8 = prs.slides[7]
    reset_slide_content(s8)
    for shape in s8.shapes:
        if shape.name == "Title 1" or (shape.is_placeholder and shape.placeholder_format.idx == 0):
            shape.text_frame.text = "FINAL YEAR PROJECT PRESENTATION & DEMO"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Arial"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = UG_NAVY
        elif shape.name == "Subtitle 2" or (shape.is_placeholder and shape.placeholder_format.idx == 1):
            tf = shape.text_frame
            tf.word_wrap = True
            tf.text = ""
            
            p0 = tf.paragraphs[0]
            p0.text = "THANK YOU FOR YOUR ATTENTION\n"
            p0.font.name = "Arial"
            p0.font.size = Pt(24)
            p0.font.bold = True
            p0.font.color.rgb = OCEAN_BLUE
            
            p1 = tf.add_paragraph()
            p1.text = "WINGRID: A Multi-Window Presentation Orchestration and Context-Aware Projection System for Live Display Environments\n"
            p1.font.name = "Arial"
            p1.font.size = Pt(13)
            p1.font.bold = True
            p1.font.color.rgb = DARK_TEXT
            
            p2 = tf.add_paragraph()
            p2.text = "Questions & Comments are Welcome\nDepartment of Computer Science, University of Ghana"
            p2.font.name = "Arial"
            p2.font.size = Pt(12)
            p2.font.color.rgb = MUTED_TEXT

    if os.path.exists(logo_path):
        s8.shapes.add_picture(logo_path, Inches(1.1), Inches(1.8), width=Inches(1.8))

    prs.save(template_path)
    print(f"Successfully enhanced presentation with visual cards, tables, and branding: {template_path}")

if __name__ == "__main__":
    enhance_presentation()
