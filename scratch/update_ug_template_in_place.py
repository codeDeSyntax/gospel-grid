import pptx
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor

def update_template_in_place():
    template_path = r"j:\electron\wingridFYP\wingrid\public\FILES\UG SLIDE TEMPLATE.pptx"
    
    prs = Presentation(template_path)
    print(f"Loaded template with {len(prs.slides)} slides.")
    
    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
    s1 = prs.slides[0]
    for shape in s1.shapes:
        if shape.name == "Title 1" or (shape.is_placeholder and shape.placeholder_format.idx == 0):
            shape.text_frame.text = "FINAL YEAR PROJECT PRESENTATION & DEMO"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Arial"
                p.font.size = Pt(22)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 51, 102)
        elif shape.name == "Subtitle 2" or (shape.is_placeholder and shape.placeholder_format.idx == 1):
            tf = shape.text_frame
            tf.word_wrap = True
            tf.text = ""
            
            p1 = tf.paragraphs[0]
            p1.text = "WINGRID: A Multi-Window Presentation Orchestration and Context-Aware Projection System for Live Display Environments\n"
            p1.font.name = "Arial"
            p1.font.size = Pt(17)
            p1.font.bold = True
            p1.font.color.rgb = RGBColor(0, 96, 137)
            
            p2 = tf.add_paragraph()
            p2.text = "NAME: [Student Name]        ID: [Student ID]\nSUPERVISOR: [Supervisor Name]\nDEPARTMENT OF COMPUTER SCIENCE, UNIVERSITY OF GHANA\nOCTOBER 2026"
            p2.font.name = "Arial"
            p2.font.size = Pt(12)
            p2.font.color.rgb = RGBColor(50, 50, 50)

    # -------------------------------------------------------------
    # Helper to set title and bullet points in Content Placeholders
    # -------------------------------------------------------------
    def populate_content_slide(slide, title_text, bullet_items):
        for shape in slide.shapes:
            if shape.has_text_frame:
                if shape.name.startswith("Title") or (shape.is_placeholder and shape.placeholder_format.idx == 0):
                    shape.text_frame.text = title_text
                    for p in shape.text_frame.paragraphs:
                        p.font.name = "Arial"
                        p.font.size = Pt(22)
                        p.font.bold = True
                        p.font.color.rgb = RGBColor(0, 51, 102)
                elif shape.name.startswith("Content") or (shape.is_placeholder and shape.placeholder_format.idx in [1, 2, 7]):
                    tf = shape.text_frame
                    tf.word_wrap = True
                    tf.text = ""
                    first = True
                    for item in bullet_items:
                        p = tf.paragraphs[0] if first else tf.add_paragraph()
                        first = False
                        if isinstance(item, tuple):
                            header, sub_items = item
                            p.text = header
                            p.level = 0
                            p.font.name = "Arial"
                            p.font.size = Pt(13.5)
                            p.font.bold = True
                            p.font.color.rgb = RGBColor(0, 80, 120)
                            p.space_after = Pt(2)
                            for sub in sub_items:
                                p_sub = tf.add_paragraph()
                                p_sub.text = sub
                                p_sub.level = 1
                                p_sub.font.name = "Arial"
                                p_sub.font.size = Pt(11.5)
                                p_sub.font.color.rgb = RGBColor(40, 40, 40)
                                p_sub.space_after = Pt(2)
                        else:
                            p.text = item
                            p.level = 0
                            p.font.name = "Arial"
                            p.font.size = Pt(12.5)
                            p.font.color.rgb = RGBColor(40, 40, 40)
                            p.space_after = Pt(3)

    # -------------------------------------------------------------
    # SLIDE 2: Outline of Presentation
    # -------------------------------------------------------------
    populate_content_slide(
        prs.slides[1],
        "OUTLINE OF PRESENTATION",
        [
            "1. Introduction & Research Motivation",
            "2. Problem Statement (The 4 Core Presentation Bottlenecks)",
            "3. Aims and Specific Objectives",
            "4. Related Work & Competitive Analysis",
            "5. Proposed Solution: 'Two Windows, One Operator' Architecture",
            "6. Key Subsystems & Real-Time AI Context Intelligence",
            "7. System Demonstration & Live Workflow",
            "8. Conclusion & Future Work"
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 3: Introduction
    # -------------------------------------------------------------
    populate_content_slide(
        prs.slides[2],
        "Introduction & Background",
        [
            ("The Multi-Source Presentation Dilemma:", [
                "Live presentation environments (churches, classrooms, hybrid streams) demand simultaneous content from multiple live software applications (slides, Bible software, live code, browsers, timers).",
                "Existing meeting tools (Zoom, Teams) were built for single-source meetings, while broadcast mixers (OBS, vMix) have steep learning curves and heavy CPU overhead."
            ]),
            ("The 4 Core Presentation Bottlenecks:", [
                "1. Single-Source Sharing Restrictions (forced to share only 1 window or entire screen).",
                "2. Display Mode Conflicts & Flickering (repeated Win+P toggling between Duplicate and Extend).",
                "3. Privacy & Desktop Exposure (unintended leakage of WhatsApp, emails, taskbars, private files).",
                "4. Manual Production Overhead (manual typing of lower-thirds, scriptures, and timers)."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 4: Aims and Objectives
    # -------------------------------------------------------------
    populate_content_slide(
        prs.slides[3],
        "Aims and Objectives",
        [
            ("Primary Aim:", [
                "To design and implement a high-performance desktop system that makes live presentations more professional and significantly smarter by lifting off display bottlenecks and introducing real-time AI context intelligence."
            ]),
            ("Specific Objectives:", [
                "1. Implement a GPU-accelerated window capture pipeline with request coalescing (30-60 FPS).",
                "2. Build a 'Two Windows, One Operator' dual-window display separation architecture.",
                "3. Integrate real-time speech-to-context AI generation (AssemblyAI + Groq Llama 3.1 in ~200ms).",
                "4. Develop local LAN mDNS device discovery and permission-gated WebRTC P2P remote screen streaming.",
                "5. Implement enterprise-grade OS-level DPAPI credential encryption at rest."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 5: Related Work
    # -------------------------------------------------------------
    populate_content_slide(
        prs.slides[4],
        "Related Work & Competitive Analysis",
        [
            ("Limitations of Existing Solutions:", [
                "Zoom / Teams / Meet: Restricted to 1 window at a time; no secondary display routing; cloud-dependent.",
                "OBS Studio / vMix: Complex scene-graph engineering; heavy CPU/GPU overhead; no automated speech AI context cards.",
                "ProPresenter / EasyWorship: Expensive ($400-$1000+); slide-centric architecture is clunky for live external applications.",
                "Windows Snap / FancyZones: Single-canvas only (titlebars and taskbars remain visible); requires Win+P display toggling."
            ]),
            ("How Wingrid Beats Existing Solutions:", [
                "Instant 1-click multi-window grids (Single, Dual, Triple, Quad) with per-window Hide/Show toggles.",
                "Strict zero-desktop isolation: captures window textures directly via GPU compositor.",
                "Real-time AI Context Intelligence: auto-generates broadcast cards in ~200ms from live spoken speech.",
                "100% local GPU execution with zero internet required for physical secondary display projection."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 6: Proposed Solution
    # -------------------------------------------------------------
    populate_content_slide(
        prs.slides[5],
        "Proposed Solution & Key Subsystems",
        [
            ("'Two Windows, One Operator' Display Model:", [
                "Primary Monitor (Control Studio): Operator manages window picker, confidence monitors, AI carousels, timers, and layout controls.",
                "Secondary Monitor (PublishedLayout): Pristine, frameless fullscreen canvas rendered directly on the target projector/LED display."
            ]),
            ("Core Engineering Subsystems:", [
                "1. Native Window Enumerator: WGC window detection with live icons, metadata, and thumbnails.",
                "2. Dynamic AutoFit Multi-Grid Compositor: Single, Dual, Triple, Quad presets with per-window Hide/Show.",
                "3. GPU Video Pipeline: Request coalescing registry for desktopCapturer (30-60 FPS, <8% CPU).",
                "4. Real-Time AI Context Producer: 16kHz PCM -> AssemblyAI WebSocket -> Groq LPU (Llama 3.1) ~200ms extraction of scriptures, lower-thirds, quotes -> 1-click Push to live.",
                "5. Network-Aware Collaboration & Security: Local mDNS discovery + permission-gated WebRTC P2P streaming + Windows DPAPI credential encryption."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 7: Conclusion / Demonstration (End Slide)
    # -------------------------------------------------------------
    populate_content_slide(
        prs.slides[6],
        "Conclusion & Live Demonstration",
        [
            ("Summary of Project Contributions:", [
                "Successfully lifted off the 4 core presentation display bottlenecks.",
                "Delivered an intuitive, zero-configuration studio with 60 FPS GPU hardware acceleration.",
                "Integrated speech-driven AI context intelligence with broadcast-ready card layouts."
            ]),
            ("Live Demonstration Workflow for the Panel:", [
                "1. Enumerate and select active Windows application windows with live thumbnails.",
                "2. Assign windows into Dual/Quad grid layouts and project via F5 (zero desktop leakage).",
                "3. Speak into microphone -> AI Context Engine auto-generates scripture card in ~200ms -> 1-Click Push to live display.",
                "4. Test live F6 (Blackout) and F7 (Freeze Frame) controls.",
                "5. Discover LAN peer -> Stream remote screen feed via permission-gated WebRTC."
            ]),
            ("Future Work: Multi-speaker voice diarization & macOS/Linux display server support.")
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 8: Final Title Slide (Thank You)
    # -------------------------------------------------------------
    s8 = prs.slides[7]
    for shape in s8.shapes:
        if shape.name == "Title 1" or (shape.is_placeholder and shape.placeholder_format.idx == 0):
            shape.text_frame.text = "FINAL YEAR PROJECT PRESENTATION & DEMO"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Arial"
                p.font.size = Pt(22)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 51, 102)
        elif shape.name == "Subtitle 2" or (shape.is_placeholder and shape.placeholder_format.idx == 1):
            tf = shape.text_frame
            tf.word_wrap = True
            tf.text = ""
            
            p1 = tf.paragraphs[0]
            p1.text = "THANK YOU FOR YOUR ATTENTION\n"
            p1.font.name = "Arial"
            p1.font.size = Pt(20)
            p1.font.bold = True
            p1.font.color.rgb = RGBColor(0, 96, 137)
            
            p2 = tf.add_paragraph()
            p2.text = "WINGRID: A Multi-Window Presentation Orchestration and Context-Aware Projection System for Live Display Environments\n\nQuestions & Comments are Welcome\n\nDEPARTMENT OF COMPUTER SCIENCE, UNIVERSITY OF GHANA"
            p2.font.name = "Arial"
            p2.font.size = Pt(13)
            p2.font.color.rgb = RGBColor(50, 50, 50)

    prs.save(template_path)
    print(f"Successfully updated original template in-place: {template_path}")

if __name__ == "__main__":
    update_template_in_place()
