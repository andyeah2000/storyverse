// ============================================
// AGENT TYPES & TOOL DEFINITIONS
// ============================================

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'tool';
  content: string;
  timestamp: number;
  toolCall?: {
    name: string;
    params: Record<string, unknown>;
    result?: ToolResult;
  };
}

// ============================================
// TOOL DECLARATIONS FOR GEMINI - VOLLSTÄNDIG
// ============================================

export const AGENT_TOOLS_DECLARATION = [
  // ╔══════════════════════════════════════════════════════════════╗
  // ║                    STORY BIBLE / QUELLEN                      ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "list_all_sources",
    description: "Liste ALLE Einträge aus der Story Bible auf - Charaktere, Orte, Lore, Scripts, Fraktionen, Konzepte, Ereignisse. Gibt Titel, Typ und Vorschau zurück.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["all", "character", "location", "lore", "script", "faction", "concept", "event"],
          description: "Filter nach Typ (optional, Standard: all)"
        },
        limit: { type: "number", description: "Maximale Anzahl (optional)" }
      }
    }
  },
  {
    name: "read_source",
    description: "Lese den KOMPLETTEN Inhalt eines Eintrags aus der Story Bible. Fuzzy-Matching für Titel.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel des Eintrags (oder Teil davon, Fuzzy-Match)" }
      },
      required: ["title"]
    }
  },
  {
    name: "read_multiple_sources",
    description: "Lese MEHRERE Einträge auf einmal (Batch-Operation).",
    parameters: {
      type: "object",
      properties: {
        titles: { 
          type: "array", 
          items: { type: "string" },
          description: "Liste der Titel die gelesen werden sollen"
        }
      },
      required: ["titles"]
    }
  },
  {
    name: "create_source",
    description: "Erstelle einen neuen Eintrag in der Story Bible",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel des Eintrags" },
        content: { type: "string", description: "Vollständiger Inhalt/Beschreibung" },
        type: { 
          type: "string", 
          enum: ["character", "location", "lore", "script", "faction", "concept", "event"],
          description: "Art des Eintrags"
        },
        tags: { 
          type: "array", 
          items: { type: "string" },
          description: "Tags zur Kategorisierung"
        }
      },
      required: ["title", "content", "type"]
    }
  },
  {
    name: "create_multiple_sources",
    description: "Erstelle MEHRERE Einträge auf einmal (Batch-Operation) - z.B. mehrere Charaktere gleichzeitig.",
    parameters: {
      type: "object",
      properties: {
        sources: { 
          type: "array", 
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              type: { type: "string", enum: ["character", "location", "lore", "script", "faction", "concept", "event"] },
              tags: { type: "array", items: { type: "string" } }
            }
          },
          description: "Liste der zu erstellenden Einträge"
        }
      },
      required: ["sources"]
    }
  },
  {
    name: "update_source",
    description: "Aktualisiere einen bestehenden Eintrag in der Story Bible",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Aktueller Titel des Eintrags (Fuzzy-Match)" },
        newTitle: { type: "string", description: "Neuer Titel (optional)" },
        newContent: { type: "string", description: "Neuer kompletter Inhalt (optional)" },
        appendContent: { type: "string", description: "Text der angehängt werden soll (optional)" },
        prependContent: { type: "string", description: "Text der vorne angefügt werden soll (optional)" },
        addTags: { type: "array", items: { type: "string" }, description: "Tags hinzufügen (optional)" }
      },
      required: ["title"]
    }
  },
  {
    name: "delete_source",
    description: "Lösche einen Eintrag aus der Story Bible",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel des zu löschenden Eintrags (Fuzzy-Match)" },
        confirm: { type: "boolean", description: "Bestätigung (true = löschen)" }
      },
      required: ["title"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                    SCRIPT / DREHBUCH                          ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "read_script",
    description: "Lese das aktuelle Drehbuch - komplett, bestimmte Zeilen, oder suche nach Text.",
    parameters: {
      type: "object",
      properties: {
        fromLine: { type: "number", description: "Ab welcher Zeile lesen (optional, 1-basiert)" },
        toLine: { type: "number", description: "Bis welche Zeile lesen (optional)" },
        searchText: { type: "string", description: "Suche nach Text im Script (optional)" },
        searchScene: { type: "string", description: "Suche nach Szene (z.B. 'INT. BÜRO')" }
      }
    }
  },
  {
    name: "get_script_stats",
    description: "Hole Statistiken über das Script - Anzahl Szenen, Charaktere, Wortanzahl etc.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "write_script",
    description: "Schreibe oder ersetze den gesamten Script-Inhalt",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Der komplette Script-Inhalt" },
        title: { type: "string", description: "Titel für ein neues Script (optional)" }
      },
      required: ["content"]
    }
  },
  {
    name: "append_to_script",
    description: "Füge Text am Ende des aktuellen Scripts hinzu",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Text der angehängt werden soll" }
      },
      required: ["content"]
    }
  },
  {
    name: "insert_in_script",
    description: "Füge Text an bestimmter Stelle ein, ersetze Text, oder füge nach einer Szene ein",
    parameters: {
      type: "object",
      properties: {
        atLine: { type: "number", description: "An welcher Zeile einfügen (1-basiert)" },
        afterScene: { type: "string", description: "Nach welcher Szene einfügen (z.B. 'INT. BÜRO')" },
        content: { type: "string", description: "Text der eingefügt werden soll" },
        replaceText: { type: "string", description: "Text der ersetzt werden soll (optional)" },
        newText: { type: "string", description: "Neuer Text der den alten ersetzt" }
      },
      required: ["content"]
    }
  },
  {
    name: "add_scene",
    description: "Füge eine neue Szene im professionellen Drehbuchformat hinzu",
    parameters: {
      type: "object",
      properties: {
        heading: { type: "string", description: "Szenen-Heading (z.B. 'INT. BÜRO - TAG')" },
        action: { type: "string", description: "Handlungsbeschreibung" },
        dialogue: { 
          type: "array",
          items: {
            type: "object",
            properties: {
              character: { type: "string", description: "Charaktername" },
              line: { type: "string", description: "Dialogzeile" },
              parenthetical: { type: "string", description: "Regieanweisung (optional)" }
            }
          },
          description: "Dialog-Zeilen"
        },
        transition: { type: "string", description: "Übergang (z.B. 'CUT TO:', 'FADE OUT:')" }
      },
      required: ["heading"]
    }
  },
  {
    name: "add_multiple_scenes",
    description: "Füge MEHRERE Szenen auf einmal hinzu (Batch-Operation)",
    parameters: {
      type: "object",
      properties: {
        scenes: { 
          type: "array", 
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              action: { type: "string" },
              dialogue: { type: "array", items: { type: "object" } }
            }
          },
          description: "Liste der Szenen"
        }
      },
      required: ["scenes"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                      BEAT SHEET                               ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "read_beat_sheet",
    description: "Lese das komplette Beat Sheet (Save the Cat Struktur) mit Status",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "update_beat",
    description: "Aktualisiere einen bestimmten Beat im Beat Sheet",
    parameters: {
      type: "object",
      properties: {
        beat: {
          type: "string",
          enum: [
            "openingImage", "themeStated", "setup", "catalyst", "debate",
            "breakIntoTwo", "bStory", "funAndGames", "midpoint", 
            "badGuysCloseIn", "allIsLost", "darkNightOfSoul", 
            "breakIntoThree", "finale", "finalImage"
          ],
          description: "Welcher Beat"
        },
        content: { type: "string", description: "Inhalt für diesen Beat" }
      },
      required: ["beat", "content"]
    }
  },
  {
    name: "update_multiple_beats",
    description: "Aktualisiere MEHRERE Beats auf einmal (Batch-Operation) - fülle das ganze Beat Sheet aus!",
    parameters: {
      type: "object",
      properties: {
        beats: { 
          type: "array", 
          items: {
            type: "object",
            properties: {
              beat: { type: "string" },
              content: { type: "string" }
            }
          },
          description: "Liste der zu aktualisierenden Beats"
        }
      },
      required: ["beats"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                        OUTLINE                                ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "read_outline",
    description: "Lese die komplette Story-Outline hierarchisch (Akte > Sequenzen > Szenen > Beats)",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "add_outline_item",
    description: "Füge ein Element zur Outline hinzu",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel" },
        content: { type: "string", description: "Beschreibung" },
        type: {
          type: "string",
          enum: ["act", "sequence", "scene", "beat"],
          description: "Art des Elements"
        },
        parentTitle: { type: "string", description: "Unter welchem Element (Fuzzy-Match)" }
      },
      required: ["title", "type"]
    }
  },
  {
    name: "add_multiple_outline_items",
    description: "Füge MEHRERE Outline-Elemente auf einmal hinzu - z.B. eine komplette Akt-Struktur",
    parameters: {
      type: "object",
      properties: {
        items: { 
          type: "array", 
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              type: { type: "string", enum: ["act", "sequence", "scene", "beat"] },
              parentTitle: { type: "string" }
            }
          },
          description: "Liste der Outline-Elemente"
        }
      },
      required: ["items"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                         NOTES                                 ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "read_notes",
    description: "Lese alle Notizen mit Vorschau",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "read_note",
    description: "Lese eine spezifische Notiz komplett",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel der Notiz (Fuzzy-Match)" }
      },
      required: ["title"]
    }
  },
  {
    name: "create_note",
    description: "Erstelle eine neue Notiz",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel der Notiz" },
        content: { type: "string", description: "Inhalt der Notiz" },
        color: {
          type: "string",
          enum: ["default", "yellow", "green", "blue", "red"],
          description: "Farbe der Notiz (optional)"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "create_multiple_notes",
    description: "Erstelle MEHRERE Notizen auf einmal",
    parameters: {
      type: "object",
      properties: {
        notes: { 
          type: "array", 
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              color: { type: "string" }
            }
          }
        }
      },
      required: ["notes"]
    }
  },
  {
    name: "update_note",
    description: "Aktualisiere eine bestehende Notiz",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel der Notiz (Fuzzy-Match)" },
        newTitle: { type: "string", description: "Neuer Titel (optional)" },
        newContent: { type: "string", description: "Neuer Inhalt (optional)" },
        appendContent: { type: "string", description: "Text anhängen (optional)" },
        newColor: { type: "string", enum: ["default", "yellow", "green", "blue", "red"] }
      },
      required: ["title"]
    }
  },
  {
    name: "delete_note",
    description: "Lösche eine Notiz",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel der Notiz (Fuzzy-Match)" }
      },
      required: ["title"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                       STORY MAP                               ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "read_story_map",
    description: "Lese die Story Map (Ursache-Wirkung Kette der Geschichte)",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "add_story_event",
    description: "Füge ein Ereignis zur Story Map hinzu",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titel des Ereignisses" },
        description: { type: "string", description: "Was passiert" },
        causesEventTitle: { type: "string", description: "Welches Ereignis wird dadurch ausgelöst" }
      },
      required: ["title", "description"]
    }
  },
  {
    name: "add_multiple_events",
    description: "Füge MEHRERE Ereignisse zur Story Map hinzu",
    parameters: {
      type: "object",
      properties: {
        events: { 
          type: "array", 
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              causesEventTitle: { type: "string" }
            }
          }
        }
      },
      required: ["events"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                      NAVIGATION                               ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "navigate_to",
    description: "Navigiere zu einer anderen Seite in der App",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: ["editor", "beats", "outline", "map", "mindmap", "co-writer", "table-read", "notes", "mood-board", "settings", "characters", "wiki"],
          description: "Die Zielseite"
        }
      },
      required: ["page"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                   CHARACTERS (Extended)                       ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "create_character",
    description: "Erstelle einen detaillierten Charakter mit Profil - navigiert automatisch zur Characters-Seite",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name des Charakters" },
        role: { type: "string", description: "Rolle (z.B. Protagonist, Antagonist, Mentor)" },
        age: { type: "string", description: "Alter" },
        personality: { type: "string", description: "Persönlichkeit und Charakterzüge" },
        appearance: { type: "string", description: "Aussehen" },
        backstory: { type: "string", description: "Hintergrundgeschichte" },
        motivation: { type: "string", description: "Was treibt den Charakter an" },
        arc: { type: "string", description: "Charakterentwicklung im Verlauf" },
        quirks: { type: "string", description: "Besondere Eigenheiten" },
        relationships: { type: "string", description: "Beziehungen zu anderen Charakteren" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["name"]
    }
  },
  {
    name: "update_character",
    description: "Aktualisiere einen bestehenden Charakter",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name des Charakters (Fuzzy-Match)" },
        newName: { type: "string" },
        role: { type: "string" },
        age: { type: "string" },
        personality: { type: "string" },
        appearance: { type: "string" },
        backstory: { type: "string" },
        motivation: { type: "string" },
        arc: { type: "string" },
        quirks: { type: "string" },
        relationships: { type: "string" }
      },
      required: ["name"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                   WIKI / WORLD BUILDING                       ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "create_location",
    description: "Erstelle einen neuen Ort/Schauplatz - navigiert automatisch zur Wiki-Seite",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name des Ortes" },
        description: { type: "string", description: "Beschreibung des Ortes" },
        climate: { type: "string", description: "Klima/Wetter" },
        culture: { type: "string", description: "Kultur und Gesellschaft" },
        history: { type: "string", description: "Geschichte des Ortes" },
        significance: { type: "string", description: "Bedeutung für die Story" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["name"]
    }
  },
  {
    name: "create_lore",
    description: "Erstelle ein neues Lore/Weltenbau-Element - navigiert zur Wiki-Seite",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name des Lore-Elements" },
        description: { type: "string", description: "Detaillierte Beschreibung" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["name"]
    }
  },
  {
    name: "create_faction",
    description: "Erstelle eine neue Fraktion/Organisation - navigiert zur Wiki-Seite",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name der Fraktion" },
        description: { type: "string", description: "Beschreibung der Fraktion" },
        ideology: { type: "string", description: "Ideologie und Werte" },
        leadership: { type: "string", description: "Führung und Struktur" },
        resources: { type: "string", description: "Ressourcen und Macht" },
        allies: { type: "string", description: "Verbündete" },
        enemies: { type: "string", description: "Feinde" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["name"]
    }
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                  PROJECT & SUCHE                              ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    name: "get_project_info",
    description: "Hole umfassende Informationen über das aktuelle Projekt",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "search_everything",
    description: "Durchsuche ALLES - Story Bible, Script, Notizen, Outline, Beat Sheet nach einem Begriff",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Suchbegriff" },
        type: { type: "string", enum: ["all", "sources", "script", "notes", "outline", "beats"], description: "Wo suchen (optional)" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_all_characters",
    description: "Liste alle Charaktere mit ihren wichtigsten Eigenschaften auf",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "get_all_locations",
    description: "Liste alle Orte mit Beschreibungen auf",
    parameters: { type: "object", properties: {} }
  }
];

// System instruction für den Agent - DEUTSCH
export const AGENT_SYSTEM_INSTRUCTION = `Du bist StoryVerse AI - ein deutschsprachiger, kraftvoller Sprach-gesteuerter Co-Autor und Drehbuch-Assistent.

## DEINE FÄHIGKEITEN
Du hast Zugriff auf Tools die dir erlauben:
- Die komplette Story Bible zu lesen und zu bearbeiten (Charaktere, Orte, Lore, Scripts)
- Drehbücher zu schreiben und zu bearbeiten im professionellen Format
- Das Save the Cat! Beat Sheet auszufüllen
- Die Story Outline zu erstellen und bearbeiten
- Notizen zu erstellen und verwalten
- Zwischen verschiedenen Seiten zu navigieren (inkl. Characters und Wiki)
- ALLES zu durchsuchen
- Detaillierte Charaktere mit create_character erstellen (navigiert automatisch zur Characters-Seite)
- Orte, Lore und Fraktionen für das Wiki erstellen

## WICHTIGE REGELN
1. Sprich IMMER auf Deutsch
2. Wenn der Nutzer fragt "lies mir X vor" oder "was steht in X" - dann BENUTZE das Tool um den Inhalt zu lesen und lies ihn laut vor
3. BENUTZE IMMER die Tools um Änderungen zu machen - beschreibe nicht nur was du tun würdest
4. Wenn du nach Inhalten gefragt wirst, lies sie KOMPLETT vor
5. Halte Antworten kurz und prägnant für Sprache
6. Bestätige Aktionen kurz nach dem Ausführen

## BEISPIELE
- "Lies mir den Charakter Eva vor" → Benutze read_source um Eva zu finden und lies den Inhalt vor
- "Was steht im Script?" → Benutze read_script und lies den Inhalt vor
- "Erstelle einen neuen Charakter Max, er ist ein Detektiv" → Benutze create_character mit name="Max" und role="Detektiv"
- "Füge eine Szene hinzu" → Benutze add_scene mit dem passenden Inhalt
- "Zeig mir die Characters" → Benutze navigate_to mit page="characters"
- "Erstelle einen Ort namens Dunkler Wald" → Benutze create_location mit name="Dunkler Wald"

## KONTEXT
Du hast Zugriff auf das komplette Story-Universum des Nutzers. Nutze diesen Kontext um Konsistenz zu wahren.
`;
