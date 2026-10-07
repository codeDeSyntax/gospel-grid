import os
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor

def restore_clean_template():
    ppt_path = r"j:\electron\wingridFYP\wingrid\public\FILES\UG SLIDE TEMPLATE.pptx"
    prs = Presentation(ppt_path)
    print(f"Original template slide count: {len(prs.slides)}")

    # 1. Clean ALL custom non-placeholder shapes (cards, custom tables, pictures, overlays)
    for idx, slide in enumerate(prs.slides):
        sp_to_remove = []
        for sp in slide.shapes:
            if not sp.is_placeholder:
                sp_to_remove.append(sp)
        for sp in sp_to_remove:
            sp_elem = sp._element
            sp_elem.getparent().remove(sp_elem)
        print(f"Slide {idx+1}: removed {len(sp_to_remove)} custom overlay shapes.")

    # 2. Re-populate each slide's native placeholders cleanly
    NAVY = RGBColor(0, 51, 102)
    OCEAN = RGBColor(0, 96, 137)
    DARK = RGBColor(40, 40, 40)
    HEADER_COLOR = RGBColor(0, 80, 120)

    # Slide 1: Title Slide
    s1 = prs.slides[0]
    for sp in s1.shapes:
        if sp.is_placeholder:
            if sp.placeholder_format.idx == 0 or sp.name.startswith("Title"):
                sp.text_frame.text = "FINAL YEAR PROJECT PRESENTATION & DEMO"
                for p in sp.text_frame.paragraphs:
                    p.font.name = "Arial"
                    p.font.size = Pt(22)
                    p.font.bold = True
                    p.font.color.rgb = NAVY
            elif sp.placeholder_format.idx == 1 or sp.name.startswith("Subtitle"):
                tf = sp.text_frame
                tf.word_wrap = True
                tf.text = ""
                p1 = tf.paragraphs[0]
                p1.text = "WINGRID: A Multi-Window Presentation Orchestration and Context-Aware Projection System for Live Display Environments\n"
                p1.font.name = "Arial"
                p1.font.size = Pt(17)
                p1.font.bold = True
                p1.font.color.rgb = OCEAN
                
                p2 = tf.add_paragraph()
                p2.text = "NAME: [Student Name]        ID: [Student ID]\nSUPERVISOR: [Supervisor Name]\nDEPARTMENT OF COMPUTER SCIENCE, UNIVERSITY OF GHANA\nOCTOBER 2026"
                p2.font.name = "Arial"
                p2.font.size = Pt(12)
                p2.font.color.rgb = RGBColor(60, 60, 60)

    def set_slide_bullets(slide, title_text, groups):
        for sp in slide.shapes:
            if sp.has_text_frame:
                if sp.placeholder_format.idx == 0 or sp.name.startswith("Title"):
                    sp.text_frame.text = title_text
                    for p in sp.text_frame.paragraphs:
                        p.font.name = "Arial"
                        p.font.size = Pt(22)
                        p.font.bold = True
                        p.font.color.rgb = NAVY
                elif sp.placeholder_format.idx in [1, 2, 7] or sp.name.startswith("Content"):
                    tf = sp.text_frame
                    tf.word_wrap = True
                    tf.text = ""
                    first = True
                    for group in groups:
                        if isinstance(group, tuple):
                            heading, bullets = group
                            p = tf.paragraphs[0] if first else tf.add_paragraph()
                            first = False
                            p.text = heading
                            p.level = 0
                            p.font.name = "Arial"
                            p.font.size = Pt(14)
                            p.font.bold = True
                            p.font.color.rgb = HEADER_COLOR
                            p.space_after = Pt(2)
                            p.space_before = Pt(4)
                            for b in bullets:
                                p_sub = tf.add_paragraph()
                                p_sub.text = b
                                p_sub.level = 1
                                p_sub.font.name = "Arial"
                                p_sub.font.size = Pt(12)
                                p_sub.font.color.rgb = DARK
                                p_sub.space_after = Pt(2)
                        else:
                            p = tf.paragraphs[0] if first else tf.add_paragraph()
                            first = False
                            p.text = group
                            p.level = 0
                            p.font.name = "Arial"
                            p.font.size = Pt(13)
                            p.font.color.rgb = DARK
                            p.space_after = Pt(3)

    # Slide 2: Outline
    set_slide_bullets(
        prs.slides[1],
        "OUTLINE OF PRESENTATION",
        [
            "1. Introduction & Research Motivation",
            "2. Problem Statement (The 4 Core Presentation Bottlenecks)",
            "3. Aims and Specific Objectives",
            "4. Related Work & Competitive Analysis",
            "5. Proposed Solution: 'Two Windows, One Operator' Architecture",
            "6. Key Subsystems & Real-Time AI Context Intelligence",
            "7. Live Demonstration & Verification Workflow",
            "8. Conclusion & Future Research Scope"
        ]
    )

    # Slide 3: Background & Problem Statement
    set_slide_bullets(
        prs.slides[2],
        "Introduction & Problem Statement",
        [
            ("The Multi-Source Presentation Challenge", [
                "Modern presentations (churches, classrooms, auditoriums, hybrid streams) require simultaneous display of multiple applications (slides, code, Bible tools, browser, timers).",
                "Meeting tools (Zoom, Teams) only share one window; broadcast mixers (OBS, vMix) are too complex for average presenters."
            ]),
            ("The 4 Core Presentation Bottlenecks", [
                "1. Single-Source Restriction: Inability to project multiple selected windows side-by-side cleanly.",
                "2. Display Mode Conflicts: Repeated Win+P switching (Duplicate vs. Extend) causes display flickering and delays.",
                "3. Privacy & Desktop Exposure: Full desktop sharing risks accidental leakage of WhatsApp, emails, and private files.",
                "4. Manual Production Overhead: Heavy manual typing required for speaker lower-thirds, scripture references, and timers."
            ])
        ]
    )

    # Slide 4: Aims and Objectives
    set_slide_bullets(
        prs.slides[3],
        "Aims and Specific Objectives",
        [
            ("Primary Research Aim", [
                "To design and implement a high-performance presentation orchestration system that makes live presentations more professional and smarter by lifting off display bottlenecks and introducing real-time AI context intelligence."
            ]),
            ("Specific FYP Objectives", [
                "1. Build a high-performance GPU-accelerated window capture pipeline with request coalescing (30-60 FPS).",
                "2. Develop a 'Two Windows, One Operator' architecture separating control studio from audience projection.",
                "3. Implement an automated real-time speech-to-context AI engine using AssemblyAI and Groq Llama 3.1 (~200ms).",
                "4. Engineer zero-config local mDNS discovery and permission-gated WebRTC P2P remote screen streaming.",
                "5. Integrate enterprise-grade OS-level DPAPI encryption for secure credential storage at rest."
            ])
        ]
    )

    # Slide 5: Related Work & Competitive Analysis
    set_slide_bullets(
        prs.slides[4],
        "Related Work & Competitive Analysis",
        [
            ("Limitations of Existing Alternatives", [
                "Zoom / Teams / Meet: Restricted to 1 window; no secondary display routing; risks desktop privacy; cloud dependent.",
                "OBS Studio / vMix: Steep learning curve; heavy CPU/GPU load; complex scene graphs; no automated speech AI.",
                "ProPresenter / EasyWorship: Expensive ($400-$1000+); rigid slide-centric design clunky for external app windows.",
                "Windows Snap / FancyZones: Single-monitor only (titlebars and taskbars remain visible); requires Win+P display switching."
            ]),
            ("How Wingrid Beats Existing Solutions", [
                "Responsive Multi-Grids: Instant 1-click Single, Dual, Triple, and Quad grids with independent Hide/Show toggles.",
                "Strict Zero-Desktop Isolation: Captures window textures directly via GPU compositor with pristine presentation borders.",
                "Real-Time AI Context Intelligence: Auto-generates broadcast cards in ~200ms from spoken speech with 1-click push to live.",
                "100% Local GPU Execution: Zero cloud dependencies required for live multi-window projection."
            ])
        ]
    )

    # Slide 6: Proposed Solution & Subsystems
    set_slide_bullets(
        prs.slides[5],
        "Proposed Solution & Key Subsystems",
        [
            ("'Two Windows, One Operator' Architectural Model", [
                "Primary Monitor (Control Studio): Operator manages window picker, confidence previews, AI context cards, and timers.",
                "Secondary Monitor (PublishedLayout): Pristine, frameless fullscreen canvas rendered directly on the target projector/LED display.",
                "IPC State Sync: Real-time synchronization across Electron IPC channels with sub-16ms latency."
            ]),
            ("Core Engineering Subsystems", [
                "1. Native Window Enumerator: WGC window detection with live thumbnails, app icons, and search filtering.",
                "2. AutoFit Multi-Grid Compositor: Single, Dual (50/50), Triple, and Quad (2x2) layouts with per-window visibility toggles.",
                "3. GPU Video Pipeline: Request coalescing registry for desktopCapturer (30-60 FPS, <8% CPU utilization).",
                "4. Real-Time AI Context Producer: 16kHz PCM -> AssemblyAI WebSocket -> Groq LPU (Llama 3.1) ~200ms structured extraction.",
                "5. LAN Collaboration & Security: Zero-config mDNS discovery, WebRTC P2P streaming, and Windows DPAPI credential encryption."
            ])
        ]
    )

    # Slide 7: Demonstration & Conclusion
    set_slide_bullets(
        prs.slides[6],
        "Live Demonstration Flow & Contributions",
        [
            ("Demonstration Flow for the Panel", [
                "Step 1 (Window Discovery): Launch Wingrid -> Auto-enumerate active desktop windows with live thumbnails.",
                "Step 2 (Multi-Grid Composition): Assign multiple sources (e.g., Slides + Bible + Code) into Dual/Quad grid.",
                "Step 3 (Live Output): Trigger F5 Projection -> Verify clean fullscreen output on projector with zero desktop clutter.",
                "Step 4 (AI Context Engine): Speak live into mic -> Verify AI auto-generating scripture card in ~200ms -> Push to Live.",
                "Step 5 (Broadcast Controls): Test instant live F6 (Blackout) and F7 (Freeze Frame) hotkeys.",
                "Step 6 (LAN Streaming): Stream remote screen feed across Wi-Fi via permission-gated WebRTC."
            ]),
            ("Summary of Contributions & Future Work", [
                "Contributions: Solved all 4 presentation bottlenecks; built dual-window GPU engine; integrated real-time speech AI.",
                "Future Scope: Multi-speaker voice diarization, cross-platform macOS/Linux capture support, automated AI camera tracking."
            ])
        ]
    )

    # Slide 8: Q&A / Closing
    s8 = prs.slides[7]
    for sp in s8.shapes:
        if sp.is_placeholder:
            if sp.placeholder_format.idx == 0 or sp.name.startswith("Title"):
                sp.text_frame.text = "FINAL YEAR PROJECT PRESENTATION & DEMO"
                for p in sp.text_frame.paragraphs:
                    p.font.name = "Arial"
                    p.font.size = Pt(22)
                    p.font.bold = True
                    p.font.color.rgb = NAVY
            elif sp.placeholder_format.idx == 1 or sp.name.startswith("Subtitle"):
                tf = sp.text_frame
                tf.word_wrap = True
                tf.text = ""
                p1 = tf.paragraphs[0]
                p1.text = "THANK YOU FOR YOUR ATTENTION\n"
                p1.font.name = "Arial"
                p1.font.size = Pt(22)
                p1.font.bold = True
                p1.font.color.rgb = OCEAN
                
                p2 = tf.add_paragraph()
                p2.text = "WINGRID: A Multi-Window Presentation Orchestration and Context-Aware Projection System for Live Display Environments\n\nQuestions & Comments are Welcome\n\nDEPARTMENT OF COMPUTER SCIENCE, UNIVERSITY OF GHANA"
                p2.font.name = "Arial"
                p2.font.size = Pt(13)
                p2.font.color.rgb = RGBColor(60, 60, 60)

    prs.save(ppt_path)
    print("Successfully restored clean template presentation with 8 slides.")

if __name__ == "__main__":
    restore_clean_template()
