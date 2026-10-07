import os
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor

def update_slides_with_clear_language():
    ppt_path = r"j:\electron\wingridFYP\wingrid\public\FILES\UG SLIDE TEMPLATE.pptx"
    prs = Presentation(ppt_path)
    print(f"Loaded template with {len(prs.slides)} slides.")

    # 1. Clean any non-placeholder shapes just in case
    for idx, slide in enumerate(prs.slides):
        sp_to_remove = []
        for sp in slide.shapes:
            if not sp.is_placeholder:
                sp_to_remove.append(sp)
        for sp in sp_to_remove:
            sp_elem = sp._element
            sp_elem.getparent().remove(sp_elem)

    # Colors
    NAVY = RGBColor(0, 51, 102)        # #003366 - UG Navy
    OCEAN = RGBColor(0, 96, 137)       # #006089 - Wingrid Ocean Blue
    DARK = RGBColor(45, 45, 45)        # Clean dark text
    HEADER_BLUE = RGBColor(0, 80, 120) # Section Header Blue

    # Helper function to format content slides with readable fonts & spacing
    def format_slide_content(slide, title_text, groups):
        for sp in slide.shapes:
            if sp.has_text_frame:
                if sp.placeholder_format.idx == 0 or sp.name.startswith("Title"):
                    sp.text_frame.text = title_text
                    for p in sp.text_frame.paragraphs:
                        p.font.name = "Arial"
                        p.font.size = Pt(21)
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
                            p.font.size = Pt(13.5)
                            p.font.bold = True
                            p.font.color.rgb = HEADER_BLUE
                            p.space_after = Pt(2)
                            p.space_before = Pt(4)
                            for b in bullets:
                                p_sub = tf.add_paragraph()
                                p_sub.text = b
                                p_sub.level = 1
                                p_sub.font.name = "Arial"
                                p_sub.font.size = Pt(11.5)
                                p_sub.font.color.rgb = DARK
                                p_sub.space_after = Pt(2)
                        else:
                            p = tf.paragraphs[0] if first else tf.add_paragraph()
                            first = False
                            p.text = group
                            p.level = 0
                            p.font.name = "Arial"
                            p.font.size = Pt(12.5)
                            p.font.color.rgb = DARK
                            p.space_after = Pt(3)

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
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
                p1.text = "WINGRID: An Intelligent Multi-Window Presentation Orchestration & Live Projection System\n"
                p1.font.name = "Arial"
                p1.font.size = Pt(17)
                p1.font.bold = True
                p1.font.color.rgb = OCEAN
                
                p2 = tf.add_paragraph()
                p2.text = "Presented by: [Student Name]  |  Student ID: [Student ID]\nSupervisor: [Supervisor Name]\nDepartment of Computer Science, University of Ghana\nOctober 2026"
                p2.font.name = "Arial"
                p2.font.size = Pt(12)
                p2.font.color.rgb = RGBColor(60, 60, 60)

    # -------------------------------------------------------------
    # SLIDE 2: Presentation Outline
    # -------------------------------------------------------------
    format_slide_content(
        prs.slides[1],
        "Outline of Presentation",
        [
            "1. Motivation: Why Modern Live Presentations Struggle",
            "2. Problem Statement: The 4 Core Presentation Headaches",
            "3. Research Aim and Specific Objectives",
            "4. Competitive Analysis: Why Existing Tools Fall Short",
            "5. Proposed Solution: The 'Two Windows, One Operator' Design",
            "6. Key System Capabilities & Real-Time AI Context Assistant",
            "7. Live System Demonstration & Workflow Verification",
            "8. Summary of Contributions, Conclusion & Future Scope"
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 3: Motivation & Problem Statement
    # -------------------------------------------------------------
    format_slide_content(
        prs.slides[2],
        "Motivation & Problem Statement",
        [
            ("The Multi-Source Presentation Challenge", [
                "Modern presenters (lecturers, speakers, tech leads, churches) no longer rely on static slides alone.",
                "They actively combine slides, live code, scriptures, web browsers, and countdown timers simultaneously.",
                "Existing tools (Zoom, Teams) only share one screen, while broadcast tools (OBS) are too complex for everyday users."
            ]),
            ("The 4 Core Presentation Headaches", [
                "1. Single-Source Lock: Inability to project multiple open windows side-by-side without messy manual resizing.",
                "2. Display Mode Conflicts: Repeatedly toggling Win+P (Duplicate vs. Extend) causes screen freezing, flickering, and delays.",
                "3. Privacy & Desktop Exposure: Full-screen sharing accidentally exposes personal WhatsApp chats, emails, and private files to the audience.",
                "4. Manual Production Overhead: Showing live speaker titles, scriptures, or quotes requires extra crew or distracting manual typing."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 4: Aims and Objectives
    # -------------------------------------------------------------
    format_slide_content(
        prs.slides[3],
        "Research Aim and Specific Objectives",
        [
            ("Primary Aim", [
                "To build a fast, intuitive desktop system that makes live presentations more professional and significantly smarter by eliminating display bottlenecks and introducing a real-time AI assistant for instant context projection."
            ]),
            ("Specific Objectives", [
                "1. High-Speed Capture Engine: Build a smooth, GPU-accelerated window capture pipeline (solid 60 FPS with minimal laptop CPU usage).",
                "2. 'Two Windows, One Operator' Model: Separate the private presenter control dashboard from the clean audience projection screen.",
                "3. Real-Time AI Assistant: Implement speech-to-context AI that listens live and auto-generates scripture cards, quotes, and titles in ~200ms.",
                "4. Wireless Local Collaboration: Enable direct peer-to-peer screen streaming over local Wi-Fi without needing internet access.",
                "5. Secure System Credentials: Protect stored user settings and API credentials safely on the local device."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 5: Competitive Advantage
    # -------------------------------------------------------------
    format_slide_content(
        prs.slides[4],
        "Competitive Analysis: Why Existing Tools Fall Short",
        [
            ("Where Current Alternatives Fall Short", [
                "Zoom / Teams / Meet: Only shares 1 window at a time; cannot route clean video to a physical projector; risks privacy leakage.",
                "OBS Studio / vMix: Steep learning curve; drains battery and laptop CPU; requires manual scene engineering; no built-in speech AI.",
                "ProPresenter / EasyWorship: Very expensive ($400-$1,000+); rigid slide-centric design is clunky for showing live external apps.",
                "Windows Snap / FancyZones: Confined to a single monitor; keeps messy titlebars and taskbars visible to the audience."
            ]),
            ("Wingrid's Distinct Advantage", [
                "1-Click Multi-Window Grids: Instant side-by-side splits (Single, Dual, Triple, Quad) with per-window Hide/Show toggles.",
                "Strict Zero-Desktop Isolation: Projects only clean app content -- never your desktop background, taskbar, or popups.",
                "Zero-Effort AI Assistance: Listens to the speaker and prepares broadcast-ready summary cards automatically.",
                "100% Local Reliability: Operates smoothly on local hardware without depending on cloud servers for live projection."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 6: Proposed Solution & Subsystems
    # -------------------------------------------------------------
    format_slide_content(
        prs.slides[5],
        "Proposed Solution: Architecture & Key Capabilities",
        [
            ("The 'Two Windows, One Operator' Architecture", [
                "Primary Screen (Control Studio): Private dashboard for the speaker to select windows, preview feeds, toggle AI cards, and set timers.",
                "Secondary Screen (Audience View): Pristine, borderless fullscreen output sent directly to the projector, TV, or LED wall.",
                "Instant Sync: Smooth real-time coordination between both screens with zero perceptible lag."
            ]),
            ("Core Built-In Features", [
                "1. Smart Window Discovery: Automatically detects all open desktop apps with live visual preview thumbnails.",
                "2. Responsive Grid Compositor: Auto-fits selected windows into clean 2-split or 4-split layouts with 1-click controls.",
                "3. Live Broadcast Hotkeys: Instant emergency Blackout (F6), Freeze Frame (F7), and Live Projection Toggle (F5).",
                "4. Real-Time AI Context Engine: Converts live speech to structured cards (scriptures, speaker lower-thirds, key quotes) in ~200ms.",
                "5. Wireless Screen Sharing: Pulls live video feeds wirelessly from guest devices over local Wi-Fi with permission approval."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 7: Live Demonstration & Contributions
    # -------------------------------------------------------------
    format_slide_content(
        prs.slides[6],
        "Live Demonstration Flow & Summary of Contributions",
        [
            ("Demonstration Flow for the Panel", [
                "Step 1 (Auto-Detection): Open Wingrid -> View active desktop windows with real-time preview thumbnails.",
                "Step 2 (Multi-Window Grid): Combine multiple sources (e.g., Slide Deck + Bible App / Live Code) into a clean Dual Grid.",
                "Step 3 (Audience Projection): Press F5 -> Verify pristine projector output with zero desktop clutter or taskbars.",
                "Step 4 (Smart AI Assistant): Speak into the mic -> AI auto-generates a scripture/quote card in ~200ms -> Click 'Push to Live'.",
                "Step 5 (Emergency Controls): Demonstrate instant Blackout (F6) and Freeze Frame (F7).",
                "Step 6 (Wireless Feed): Connect a secondary laptop feed wirelessly over local Wi-Fi."
            ]),
            ("Summary of Contributions & Future Scope", [
                "Key Contributions: Solved the 4 core presentation headaches; built dual-window GPU engine; integrated real-time speech AI.",
                "Future Enhancements: Multi-speaker voice identification, cross-platform support (macOS/Linux), and auto-camera framing."
            ])
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 8: Q&A / Closing
    # -------------------------------------------------------------
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
                p2.text = "WINGRID: Making Live Presentations Professional, Effortless, and Smart\n\nQuestions & Comments are Welcome\n\nDepartment of Computer Science, University of Ghana"
                p2.font.name = "Arial"
                p2.font.size = Pt(13)
                p2.font.color.rgb = RGBColor(60, 60, 60)

    try:
        prs.save(ppt_path)
        print(f"Successfully saved to: {ppt_path}")
    except PermissionError:
        print(f"File {ppt_path} locked.")
    
    backup_path = r"j:\electron\wingridFYP\wingrid\public\FILES\Wingrid_Defence_Presentation_Clear.pptx"
    prs.save(backup_path)
    print(f"Successfully saved to: {backup_path}")

if __name__ == "__main__":
    update_slides_with_clear_language()
