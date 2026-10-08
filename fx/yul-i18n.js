/* ==========================================================================
   YUL i18n · sélecteur de langue FR / EN pour YUL FC Digital Stadium
   --------------------------------------------------------------------------
   Principe : le site d'origine mélange français et anglais. Ce script garde
   le texte d'origine de chaque élément et l'affiche dans la langue choisie
   grâce au dictionnaire ci-dessous (aussi pour le contenu généré par le JS).
   - Les noms des zones (THE PITCH, MATCH CENTER, FAN ZONE...) sont des noms
     de marque : ils restent identiques dans les deux langues.
   - Les espaces privés (Command Center staff, Player Hub) ne sont pas traduits.
   Ajouter une traduction : ajouter une ligne ['texte FR', 'texte EN'] dans T.
   ========================================================================== */
(function(){
  'use strict';

  /* ---------- Dictionnaire : [français, anglais] ---------- */
  const T = [
    // Intro / en-tête / menus
    ['MATCHS', 'MATCHES'], ['ÉQUIPE', 'TEAM'],
    ['PASSER', 'SKIP'], ['BIENVENUE AU', 'WELCOME TO'], ['ENTRER DANS LE STADE', 'ENTER THE STADIUM'],
    ['Équipe', 'Squad'], ['Matchs', 'Matches'], ['Statistiques', 'Stats'], ['Actualités', 'News'],
    ['Recrutement', 'Recruitment'], ['Partenaires', 'Partners'], ['Prédictions', 'Predictions'],
    ['ZONE JOUEUR', 'PLAYER ZONE'], ['ZONE COACH', 'COACH ZONE'], ['EN DIRECT', 'LIVE'],
    ['← ACCUEIL', '← HOME'], ['← Accueil', '← Home'], ['LE CLUB', 'THE CLUB'], ['NOTRE HISTOIRE', 'OUR STORY'],
    ['Qui sommes-nous', 'Who we are'], ['Saison 2026', '2026 Season'], ['NOUS REJOINDRE', 'JOIN US'],
    ['ESPACES MEMBRES', 'MEMBER AREAS'], ['Locker Room · connexion joueurs', 'Locker Room · player login'],
    ['Command Center · staff', 'Command Center · staff'], ['MTL / SAISON 01', 'MTL / SEASON 01'],
    ['REJOINDRE YUL FC', 'JOIN YUL FC'], ["DÉCOUVRIR L'ÉQUIPE", 'MEET THE SQUAD'], ['DÉFILER', 'SCROLL'],
    ["L'EFFECTIF YUL FC", 'THE YUL FC SQUAD'], ['Accès joueurs', 'Player access'], ['Classement', 'Standings'],
    ['← PRÉCÉDENT', '← PREVIOUS'], ['SUIVANT →', 'NEXT →'], ['← RETOUR', '← BACK'], ['RETOUR →', 'BACK →'], ['ACCUEIL', 'HOME'],
    // Toasts
    ['BUT', 'GOAL'], ['BUTS', 'GOALS'], ['PASSES', 'ASSISTS'], ['TAMPONNÉ', 'STAMPED'], ["J'Y ÉTAIS", 'I WAS THERE'], ['Partager', 'Share'], ['Fermer', 'Close'],
    ['BUT !', 'GOAL!'],
    // Match Center
    ['// ACTIF', '// ACTIVE'], ['Prochain match.', 'Next Up.'],
    ['Chaque match, transformé en expérience digitale : avant, pendant, après.', 'Every match, turned into a digital experience: before, during, after.'],
    ['PROCHAIN MATCH', 'NEXT MATCH'], ['RÉSULTATS', 'RESULTS'], ['CALENDRIER', 'SCHEDULE'],
    ['LSAQ ÉTÉ · 11v11', 'LSAQ SUMMER · 11v11'], ['JOURS', 'DAYS'], ['HEURES', 'HOURS'],
    ['Adversaire', 'Opponent'], ['Terrain', 'Venue'], ['Compétition', 'Competition'], ['Calendrier', 'Schedule'],
    ['Voir le match', 'View Match'], ['YUL FC · FORME ACTUELLE', 'YUL FC · CURRENT FORM'], ['BILAN DE LA SAISON', 'SEASON RECORD'],
    ['MATCHS JOUÉS', 'MATCHES PLAYED'], ['VICTOIRES', 'WINS'], ['NULS', 'DRAWS'], ['DÉFAITES', 'LOSSES'],
    ['BUTS POUR', 'GOALS FOR'], ['BUTS CONTRE', 'GOALS AGAINST'], ['DIFFÉRENCE DE BUTS', 'GOAL DIFFERENCE'],
    ['BLANCHISSAGES', 'CLEAN SHEETS'], ['% DE VICTOIRES', 'WIN RATE'], ['TOUS', 'ALL'], ['LIGUE', 'LEAGUE'], ['COUPE', 'CUP'],
    ['AMICAL', 'FRIENDLY'], ['TERMINÉ', 'FULL TIME'], ['VICTOIRE', 'WIN'], ['NUL', 'DRAW'], ['DÉFAITE', 'LOSS'], ['À VENIR', 'UPCOMING'],
    ['YUL FC vs Adversaire', 'YUL FC vs Opponent'], ['SUITE DU CALENDRIER · BIENTÔT.', 'REST OF SCHEDULE · COMING SOON.'],
    ['Le calendrier complet de la saison sera publié par le staff dans Mission Control.', 'The full season schedule will be published by the staff in Mission Control.'],
    ['Le calendrier complet sera publié par le staff.', 'The full schedule will be published by the staff.'],
    ['Division Amateur · Ligue MTL', 'Amateur Division · MTL League'], ['Coupe Régionale', 'Regional Cup'], ['Match Amical', 'Friendly Match'],
    ['DIVISION AMATEUR · LIGUE MTL', 'AMATEUR DIVISION · MTL LEAGUE'], ['DERNIER RÉSULTAT', 'LAST RESULT'], ['FORME ACTUELLE', 'CURRENT FORM'],
    ['Stade Municipal', 'Municipal Stadium'], ['DOMICILE', 'HOME'], ['EXTÉRIEUR', 'AWAY'], ['JOUR DE MATCH', 'MATCHDAY'],
    // Accueil
    ['Les dernières du YUL FC.', 'Latest From YUL FC.'], ['Voir le Media Center', 'View Media Center'],
    ['À toi de jouer.', 'Make Your Call.'], ['Prédis le score →', 'Predict The Score →'],
    ['SAISON 2026', '2026 SEASON'], ['Cette saison.', 'This Season.'], ['Explorer la saison', 'Explore Season'],
    ['Position au classement', 'League Position'], ['Bilan', 'Record'], ['Forme actuelle', 'Current Form'], ['Buts', 'Goals'],
    ['⚽ MEILLEUR BUTEUR', '⚽ TOP SCORER'], ['🎯 MEILLEURS PASSEURS', '🎯 ASSIST LEADERS'], ['Passes décisives', 'Assists'],
    ['🔥 CONTRIBUTIONS AUX BUTS', '🔥 GOAL CONTRIBUTIONS'], ['Voir toutes les stats', 'View All Stats'],
    ["L'ÉQUIPE", 'THE SQUAD'], ["Découvre l'équipe.", 'Meet The Team.'], ["Voir tout l'effectif →", 'View Full Squad →'],
    ['Explore le stade.', 'Explore The Stadium.'], ['Chaque zone du club, à un clic.', 'Every part of the club, one click away.'],
    ['// RECRUTEMENT OUVERT', '// RECRUITMENT OPEN'], ['Tu crois pouvoir porter le badge ?', 'Think You Can Wear The Badge?'],
    ['Joueurs, bénévoles, partenaires : il y a une place pour toi à YUL FC.', "Players, volunteers, partners: there's a place for you at YUL FC."],
    ['DEVENIR PARTENAIRE', 'BECOME A PARTNER'], ['SAISON 2027', 'SEASON 2027'],
    // The Pitch
    ['BASE DE DONNÉES JOUEURS', 'PLAYER DATABASE'], ["L'effectif.", 'The Squad.'], ['Représenter YUL. Défendre le badge.', 'Representing YUL. Defending the badge.'],
    ['GARDIENS', 'GOALKEEPERS'], ['DÉFENSEURS', 'DEFENDERS'], ['MILIEUX', 'MIDFIELDERS'], ['ATTAQUANTS', 'FORWARDS'],
    ['POSTES PAS ENCORE DÉFINIS.', 'POSITIONS NOT YET SET.'],
    ['Le staff peut assigner les postes depuis le Command Center.', 'Staff can assign positions from the Command Center.'],
    // Data Center
    ['Les chiffres derrière le jeu.', 'The Numbers Behind The Game.'],
    ["Progression du club depuis le coup d'envoi de la saison.", 'How the club has progressed since the season kicked off.'],
    ['Victoires', 'Wins'], ['Nuls', 'Draws'], ['Défaites', 'Losses'], ['Buts marqués', 'Goals scored'], ['Taux de victoire', 'Win rate'],
    ['Forme récente', 'Recent form'], ['Possession moy.', 'Avg. possession'], ['Blanchissages', 'Clean sheets'],
    ['LE CLASSEMENT', 'THE TABLE'], ['Classement de division en attente des données officielles de la ligue.', "Division table awaiting the league's official data."],
    ['BIENTÔT', 'COMING SOON'],
    // Season Hub
    ['LE PARCOURS DE LA SAISON', 'SEASON JOURNEY'], ['Match par match.', 'Match by Match.'],
    ["Saison 2026, les 11 matchs officiels LSAQ, séries comprises. Cliquez sur un match pour l'ouvrir.", '2026 season, all 11 official LSAQ matches, playoffs included. Click a match to open it.'],
    ['Saison régulière', 'Regular season'],
    ['Coulisses et résultats', 'Behind the scenes and results'], ['Suis le club sur Instagram', 'Follow the club on Instagram'], ['Suivre', 'Follow'],
    ['MEILLEUR BUTEUR', 'TOP SCORER'], ['MEILLEUR PASSEUR', 'ASSIST LEADER'], ['PLUS DÉCISIF', 'MOST DECISIVE'], ['PLUS DÉCISIFS', 'MOST DECISIVE'], ['PASSES DÉCISIVES', 'ASSISTS'], ['BUTS + PASSES', 'GOALS + ASSISTS'], ['Toutes les stats', 'All stats'],
    ["Accès réservé aux joueurs de l'effectif. Ton email et ton code temporaire te sont envoyés par le staff.", 'Squad players only. Your email and temporary code are sent to you by the staff.'],
    ['Accès réservé au staff. Le rôle (admin, gérant, coach) est lié à ton compte.', 'Staff only. Your role (admin, manager, coach) is tied to your account.'],
    ["OUVRIR L'ESPACE JOUEUR →", 'OPEN THE PLAYER SPACE →'], ['Séries éliminatoires', 'Playoffs'], ['Quart de finale', 'Quarter-final'], ['Demi-finale', 'Semi-final'], ['Date à confirmer', 'Date TBC'],
    ['Nos saisons.', 'Our Seasons.'], ['Chaque saison. Chaque match. Notre histoire.', 'Every season. Every match. Our history.'],
    ['SAISON TERMINÉE', 'SEASON COMPLETED'], ['ÉTÉ · 11v11', 'SUMMER · 11v11'], ['2025 · ANNÉE FONDATRICE', '2025 · FOUNDING YEAR'],
    ['2027 · bientôt', '2027 · coming soon'], ['2028 · bientôt', '2028 · coming soon'], ['☀️ ÉTÉ · 11v11', '☀️ SUMMER · 11v11'],
    ['❄️ HIVER · 7v7', '❄️ WINTER · 7v7'], ['APERÇU', 'OVERVIEW'], ['CLASSEMENT', 'TABLE'], ['MATCHS', 'FIXTURES'], ['STATS', 'STATS'],
    ['RECORDS', 'RECORDS'], ['HISTORIQUE', 'HISTORY'], ['ÉTÉ', 'SUMMER'], ['HIVER', 'WINTER'],
    ['7E', '7TH'], ['SUR 11 · SAISON RÉGULIÈRE', 'OF 11 · REGULAR SEASON'], ['DIFF. DE BUTS', 'GOAL DIFF'], ['POINTS', 'POINTS'],
    ['POINTS / MATCH', 'POINTS / MATCH'], ['SÉRIES', 'PLAYOFFS'], ['QUART DE FINALE · ÉLIMINÉ', 'QUARTER-FINAL · ELIMINATED'],
    ['LE PARCOURS 2026', 'THE 2026 JOURNEY'], ['SAISON RÉGULIÈRE', 'REGULAR SEASON'], ['11 matchs', '11 matches'],
    ['7E / 11', '7TH / 11'], ['Position finale en saison régulière', 'Final regular season position'],
    ['QUALIFICATION EN SÉRIES', 'PLAYOFF QUALIFICATION'], ['YUL FC qualifié pour les séries 2026', 'YUL FC qualified for the 2026 playoffs'],
    ['QUART DE FINALE', 'QUARTER-FINAL'], ['ÉLIMINÉ', 'ELIMINATED'], ["2026 ÉTÉ rejoint l'histoire du YUL FC", '2026 SUMMER joins YUL FC History'],
    ['NOTE OFFENSIVE', 'OFFENSIVE NOTE'], ['2E MEILLURE ATTAQUE', '2ND-HIGHEST SCORING TEAM'], ['31 BUTS', '31 GOALS'],
    ['YUL FC · 5 DERNIERS', 'YUL FC · LAST 5'], ['Buts marqués', 'Goals Scored'], ['Buts encaissés', 'Goals Conceded'],
    ['Blanchissages', 'Clean Sheets'], ['MEILLEURS DE LA SAISON', 'SEASON LEADERS'], ["SOULIER D'OR", 'GOLDEN BOOT'], ['BUTS', 'GOALS'],
    ['MENEUR DE JEU', 'PLAYMAKER'], ['2 À ÉGALITÉ', '2 TIED'], ['PASSES', 'ASSISTS'], ['LEADER OFFENSIF', 'ATTACKING LEADER'],
    ['CONTRIBUTIONS AUX BUTS', 'GOAL CONTRIBUTIONS'], ['PLUS DE MATCHS JOUÉS', 'MOST APPEARANCES'], ['5 À ÉGALITÉ', '5 TIED'],
    ['MATCHS JOUÉS', 'APPEARANCES'], ['POSITION', 'POSITION'], ['DB', 'GD'], ['CLASSEMENT DE LA LIGUE', 'LEAGUE TABLE'],
    ['CLASSEMENT FINAL', 'FINAL TABLE'], ['· SAISON TERMINÉE', '· SEASON COMPLETE'], ['BP', 'GF'], ['BC', 'GA'],
    ['🏆 CHAMPION', '🏆 CHAMPION'], ['DB positive', 'Positive GD'], ['DB négative', 'Negative GD'],
    ["STATS D'ÉQUIPE", 'TEAM STATS'], ['BUTS ENCAISSÉS', 'GOALS CONCEDED'], ['BUTS / MATCH', 'GOALS / MATCH'],
    ['ENCAISSÉS / MATCH', 'CONCEDED / MATCH'], ['% VICTOIRES', 'WIN %'], ['% BLANCHISSAGES', 'CLEAN SHEET %'],
    ['CARTONS JAUNES', 'YELLOW CARDS'], ['CARTONS ROUGES', 'RED CARDS'], ['DOMICILE / EXTÉRIEUR', 'HOME / AWAY'],
    ['Joués', 'Played'], ['STATISTIQUES DES JOUEURS', 'PLAYER STATISTICS'], ['JOUEUR', 'PLAYER'],
    ['MEILLEURS BUTEURS', 'TOP SCORERS'], ['MEILLEURS PASSEURS', 'ASSIST LEADERS'], ['PASSES · CO-LEADERS', 'ASSISTS · CO-LEADERS'],
    ['B+P · CO-LEADERS', 'G+A · CO-LEADERS'], ['MATCHS · CO-LEADERS', 'APPEARANCES · CO-LEADERS'],
    ['Aucun gardien désigné pour le moment.', 'No goalkeeper designated yet.'], ['DISCIPLINE', 'DISCIPLINE'],
    ['Informations statistiques uniquement.', 'Statistical information only.'], ['🟨 JAUNE', '🟨 YELLOW'], ['🟥 ROUGE', '🟥 RED'],
    ['LE LIVRE DES RECORDS DU YUL FC', 'YUL FC RECORD BOOK'], ['À venir', 'Coming soon'], ['STATS INDIVIDUELLES', 'INDIVIDUAL STATS'], ['TOUS LES TEMPS · CLUB', 'ALL-TIME · CLUB'], ['PLUS LOURDE DÉFAITE', 'HEAVIEST DEFEAT'], ['PLUS GRAND NOMBRE DE BUTS EN UN MATCH', 'MOST GOALS IN A MATCH'], ["MEILLEUR BUTEUR DE L'HISTOIRE", 'ALL-TIME TOP SCORER'],
    ['PLUS DE PASSES', 'MOST ASSISTS'], ['PLUS LARGE VICTOIRE', 'BIGGEST WIN'], ['PLUS LONGUE SÉRIE DE VICTOIRES', 'LONGEST WINNING STREAK'],
    ['PLUS LONGUE SÉRIE SANS DÉFAITE', 'LONGEST UNBEATEN STREAK'], ['2 matchs', '2 matches'], ['4 matchs', '4 matches'],
    ['TOTAUX JOUEURS 2026', '2026 PLAYER TOTALS'],
    ["Statistiques individuelles cumulées, saison 2026 uniquement (les données joueurs 2025 n'ont pas encore été fournies).", 'Cumulative individual stats, 2026 season only (2025 player data has not been provided yet).'],
    ['NOS SAISONS', 'OUR SEASONS'], ['· ANNÉE FONDATRICE', '· FOUNDING YEAR'], ['Deux chapitres · Été 11v11 · Hiver 7v7', 'Two chapters · Summer 11v11 · Winter 7v7'],
    ['4E/6', '4TH/6'], ['7E/11', '7TH/11'], ['· 26 BP · DEMI-FINALE', '· 26 GF · SEMI-FINAL'], ['· 31 BP · QUART DE FINALE', '· 31 GF · QUARTER-FINAL'],
    ['HIVER · 7v7', 'WINTER · 7v7'], ['Pas encore joué', 'Not yet played'], ["Explorer l'été", 'Explore Summer'],
    ['PROCHAIN CHAPITRE', 'NEXT CHAPTER'], ['Saison à venir', 'Future Season'], ['À ÉCRIRE.', 'TO BE WRITTEN.'],
    ['YUL FC · TOUS LES TEMPS', 'YUL FC · ALL TIME'],
    ['Statistiques cumulées de saison régulière uniquement. Les playoffs ne sont pas inclus tant que leurs résultats complets ne sont pas fournis.', 'Cumulative regular-season stats only. Playoffs are not included until their full results are provided.'],
    ['Toutes compétitions YUL FC confondues (Été 11v11 + Hiver 7v7). Jamais présenté comme une statistique LSAQ 11v11 seule.', 'All YUL FC competitions combined (Summer 11v11 + Winter 7v7). Never presented as an LSAQ 11v11-only stat.'],
    ['CHAPITRES JOUÉS', 'CHAPTERS PLAYED'], ['MATCHS DE LIGUE', 'LEAGUE MATCHES'], ['BUTS MARQUÉS', 'GOALS SCORED'],
    ['POINTS EN SAISON RÉGULIÈRE', 'REGULAR-SEASON POINTS'], ['HISTORIQUE DES SÉRIES', 'PLAYOFF HISTORY'],
    ['2025 ÉTÉ · 11v11', '2025 SUMMER · 11v11'], ['2026 ÉTÉ · 11v11', '2026 SUMMER · 11v11'], ['DEMI-FINALE · ÉLIMINÉ', 'SEMI-FINAL · ELIMINATED'],
    ['Le détail complet des matchs de playoffs (adversaires, scores, dates) sera ajouté dès qu\'il sera fourni. Aucun résultat agrégé victoires/défaites n\'est affiché tant que ces données sont incomplètes.', 'Full playoff match details (opponents, scores, dates) will be added as soon as they are provided. No aggregate win/loss result is shown while this data is incomplete.'],
    ['COMPARER LES SAISONS', 'COMPARE SEASONS'],
    ["Comparaison Été 11v11 uniquement. Le Hiver 7v7 n'a pas encore de données à comparer.", 'Summer 11v11 comparison only. Winter 7v7 has no data to compare yet.'],
    ['ÉTÉ · 11v11 · ANNÉE FONDATRICE', 'SUMMER · 11v11 · FOUNDING YEAR'], ['DEMI-FINALE', 'SEMI-FINAL'],
    ['Matchs', 'Matches'], ['Buts contre', 'Goals Against'], ['Différence de buts', 'Goal Difference'], ['Buts / match', 'Goals / Match'],
    ['Séries', 'Playoffs'], ['Points', 'Points'], ['Position', 'Position'],
    ['4E / 6', '4TH / 6'], ['ANNÉE FONDATRICE', 'FOUNDING YEAR'], ['SAISON TERMINÉE', 'SEASON COMPLETE'],
    // Media
    ['Au cœur du YUL FC.', 'Inside YUL FC.'], ['Sur le terrain et en dehors.', 'On and off the pitch.'],
    ['Matchs, moments, histoires : les archives digitales du club.', "Matches, moments, stories: the club's digital archive."],
    ['NOUVELLES', 'NEWS'], ['PHOTOS', 'PHOTOS'], ['VIDÉOS', 'VIDEOS'], ['ENTRAÎNEMENT', 'TRAINING'], ['EN COULISSES', 'BEHIND THE SCENES'],
    ['LES DERNIÈRES DU YUL FC', 'LATEST FROM YUL FC'], ['GALERIES', 'GALLERIES'], ['AUCUNE GALERIE POUR LE MOMENT.', 'NO GALLERIES YET.'],
    ['AUCUNE VIDÉO POUR LE MOMENT.', 'NO VIDEOS YET.'], ['YUL TV se remplira au fil de la saison.', 'YUL TV will fill up as the season goes on.'],
    ['RÉSULTATS', 'RESULTS'],
    // Locker / Command
    ['JOUEURS AUTORISÉS SEULEMENT', 'AUTHORIZED PLAYERS ONLY'], ['LE VESTIAIRE', 'THE LOCKER'], ['ROOM.', 'ROOM.'],
    ["YUL FC Player Hub : accès sécurisé pour l'effectif. Chaque joueur y retrouve ses disponibilités, ses statistiques et les annonces du club.", 'YUL FC Player Hub: secure access for the squad. Every player finds their availability, stats and club announcements here.'],
    ['Accès joueurs', 'Player Access'], ['Courriel', 'Email'], ['Mot de passe', 'Password'], ['Connexion', 'Login'], ['Mot de passe oublié', 'Forgot password'],
    ["ACCÈS REQUIS · Aperçu de l'expérience, authentification réelle à connecter à Supabase Auth.", 'ACCESS REQUIRED · Experience preview, real authentication to be connected to Supabase Auth.'],
    ['PROCHAIN ENTRAÎNEMENT', 'NEXT TRAINING'], ['Jeudi · 20:30', 'Thursday · 8:30 PM'], ['MA DISPONIBILITÉ', 'MY AVAILABILITY'],
    ['À confirmer', 'To be confirmed'], ['MES STATS', 'MY STATS'], ['Publiées par le staff', 'Published by staff'],
    ['CALENDRIER', 'CALENDAR'], ['ÉQUIPE', 'TEAM'], ['PROFIL', 'PROFILE'], ['TOUCHE POUR ESSAYER LE PLAYER HUB →', 'TAP TO TRY PLAYER HUB →'],
    ['vs Adversaire · Dim 11:15', 'vs Opponent · Sun 11:15'],
    ['ACCÈS STAFF', 'STAFF ACCESS'], ['YUL FC Staff Command Center : joueurs, matchs, entraînements, disponibilités, documents et communications, depuis un seul endroit.', 'YUL FC Staff Command Center: players, matches, training, availability, documents and communications, all in one place.'],
    ["Niveau d'accès", 'Access Level'], ['ENTRAÎNEUR', 'COACH'], ['ENTRAÎNEUR ADJOINT', 'ASSISTANT COACH'], ["GÉRANT D'ÉQUIPE", 'TEAM MANAGER'],
    ['Entrer dans le Command Center', 'Enter Command Center'],
    ["ACCÈS REQUIS · Aperçu de l'expérience, rôles et permissions réels à vérifier côté serveur (voir is_staff() dans le schéma).", 'ACCESS REQUIRED · Experience preview, real roles and permissions to be checked server-side (see is_staff() in the schema).'],
    ['SALLE DES TROPHÉES', 'TROPHY ROOM'], ["Trophées, saisons, records et anciens joueurs : l'archive du club.", "Trophies, seasons, records and former players: the club's archive."],
    ['NOTRE HISTOIRE', 'OUR STORY'],
    // Notre histoire
    ['// DEPUIS 2025', '// SINCE 2025'], ['Qui sommes-nous.', 'Who We Are.'],
    ["YUL FC est un club de football compétitif de Montréal, né à l'aéroport. Trois lettres, celles de l'aéroport Montréal-Trudeau, une devise,", 'YUL FC is a competitive football club from Montréal, born at the airport. Three letters, those of Montréal-Trudeau airport, one motto,'],
    [", et un groupe d'amis qui se bat pour son badge chaque week-end.", ', and a group of friends who fight for the badge every weekend.'],
    ['PHOTO À VENIR', 'PHOTO COMING SOON'], ['Déposer le fichier', 'Drop the file'], ['à la racine du site', 'in the site root'],
    ['Né à Montréal, en 2025.', 'Born in Montréal, in 2025.'],
    ['Le YUL FC dispute sa première saison en 2025 dans la ligue LSAQ, en football à 11. Pour une équipe qui découvre la compétition, le départ est solide : 4', 'YUL FC played its first season in 2025 in the LSAQ league, in 11-a-side football. For a team new to the competition, it was a solid start: 4'],
    ["sur 6, et une qualification en séries dès la saison fondatrice, jusqu'en demi-finale.", 'out of 6, and a playoff spot in the founding season, all the way to the semi-final.'],
    ["En 2026, la ligue s'agrandit à 11 équipes. Le YUL FC marque 31 buts, son meilleur total, et se qualifie de nouveau pour les séries, cette fois jusqu'en quart de finale.", 'In 2026, the league grew to 11 teams. YUL FC scored 31 goals, its best total, and made the playoffs again, this time reaching the quarter-final.'],
    ["Deux saisons, deux qualifications en séries. Le club se construit match après match, avec l'ambition d'aller chercher plus haut.", 'Two seasons, two playoff appearances. The club is being built match by match, with the ambition to go higher.'],
    ['Saisons', 'Seasons'], ['Matchs de ligue', 'League matches'], ['Qualifications en séries', 'Playoff appearances'],
    ['LE PARCOURS', 'THE JOURNEY'], ['SAISON FONDATRICE', 'FOUNDING SEASON'], ['Premiers pas en LSAQ 11v11', 'First steps in LSAQ 11v11'],
    ['sur 6 · 5 V · 1 N · 4 D · 26 buts marqués · 16 pts', 'of 6 · 5 W · 1 D · 4 L · 26 goals scored · 16 pts'],
    ['Séries : demi-finale', 'Playoffs: semi-final'], ['UNE LIGUE PLUS GRANDE', 'A BIGGER LEAGUE'], ['11 équipes, 31 buts', '11 teams, 31 goals'],
    ['sur 11 · 4 V · 2 N · 5 D · 31 buts marqués · 14 pts', 'of 11 · 4 W · 2 D · 5 L · 31 goals scored · 14 pts'],
    ['Séries : quart de finale', 'Playoffs: quarter-final'], ['LA SUITE', "WHAT'S NEXT"],
    ["Le prochain chapitre s'écrit maintenant", 'The next chapter is being written now'],
    ['Le recrutement pour la saison 2027 est ouvert.', 'Recruitment for the 2027 season is open.'], ["L'équipe du YUL FC", 'The YUL FC team'],
    // Scouting
    ['Centre de recrutement', 'Recruitment Center'], ['TU CROIS POUVOIR', 'THINK YOU CAN'], ['PORTER LE', 'WEAR THE'], ['BADGE ?', 'BADGE?'],
    ["YUL FC is looking for players ready to compete, commit and represent the club. Nous ne recherchons pas simplement des joueurs. Nous recherchons des joueurs qui veulent faire partie d'un projet.", "YUL FC is looking for players ready to compete, commit and represent the club. We're not simply looking for players. We're looking for players who want to be part of a project."],
    ['YUL FC recherche des joueurs prêts à compétitionner, à s\'engager et à représenter le club. Nous ne recherchons pas simplement des joueurs. Nous recherchons des joueurs qui veulent faire partie d\'un projet.', '__YUL_SCOUT_EN__'],
    ['// CANDIDATURES OUVERTES', '// APPLICATIONS OPEN'], ['🟢 CANDIDATURES OUVERTES', '🟢 APPLICATIONS OPEN'],
    ['Compétitionner.', 'Compete.'], ['Progresser.', 'Progress.'], ["S'engager.", 'Commit.'], ['Appartenir.', 'Belong.'],
    ['Postuler', 'Apply to Join'], ['Voir les essais', 'View Tryouts'], ['Suivre ma candidature', 'Check My Application'],
    ["PLUS QU'UNE ÉQUIPE.", 'MORE THAN A TEAM.'], ['COMPÉTITION', 'COMPETE'], ['Nous voulons gagner et progresser.', 'We want to win and improve.'],
    ['ENGAGEMENT', 'COMMITMENT'], ["La présence et l'implication sont essentielles.", 'Attendance and involvement are essential.'],
    ['PROGRESSION', 'DEVELOPMENT'], ['Chaque joueur doit chercher à améliorer son niveau.', 'Every player must strive to raise their level.'],
    ['FRATERNITÉ', 'BROTHERHOOD'], ["Le collectif passe avant l'individu.", 'The team comes before the individual.'],
    ['BESOINS ACTUELS', 'CURRENT NEEDS'], ['GARDIEN', 'GOALKEEPER'], ['OUVERT', 'OPEN'], ['DÉFENSEUR DROIT', 'RIGHT BACK'],
    ['DÉFENSEUR CENTRAL', 'CENTER BACK'], ['MILIEU', 'MIDFIELDER'], ['ATTAQUANT', 'STRIKER'], ['ESSAIS À VENIR', 'UPCOMING TRYOUTS'],
    ["AUCUN ESSAI PRÉVU POUR L'INSTANT.", 'NO TRYOUTS SCHEDULED YET.'], ['CANDIDATURES FERMÉES.', 'APPLICATIONS CLOSED.'],
    ['Laisse ton courriel pour être averti quand YUL FC ouvrira sa prochaine période de recrutement.', 'Leave your email to be notified when YUL FC opens its next recruitment window.'],
    ["M'avertir", 'Notify Me'], ['· CANDIDATURE', '· APPLICATION'], ['CANDIDATURE', 'APPLICATION'], ['01 / 07 · PERSONNEL', '01 / 07 · PERSONAL'],
    ['Qui es-tu ?', 'Who Are You?'], ['Prénom', 'First Name'], ['Nom', 'Last Name'], ['Date de naissance', 'Date of Birth'],
    ['Nationalité', 'Nationality'], ['Ville', 'City'], ['Téléphone', 'Phone'], ['Ton jeu.', 'Your Game.'],
    ["Quel(s) format(s) t'intéresse(nt) ?", 'Which format(s) are you interested in?'], ['ÉTÉ 11v11', 'SUMMER 11v11'], ['HIVER 7v7', 'WINTER 7v7'],
    ['LES DEUX', 'BOTH'], ['Poste principal · 11v11', 'Primary Position · 11v11'], ['DÉFENSEUR GAUCHE', 'LEFT BACK'],
    ['MILIEU DÉFENSIF', 'DEFENSIVE MIDFIELDER'], ['MILIEU CENTRAL', 'CENTRAL MIDFIELDER'], ['MILIEU OFFENSIF', 'ATTACKING MIDFIELDER'],
    ['AILIER DROIT', 'RIGHT WINGER'], ['AILIER GAUCHE', 'LEFT WINGER'], ['Poste secondaire (facultatif)', 'Secondary Position (optional)'],
    ['Rôle préféré · 7v7', 'Preferred Role · 7v7'], ['DÉFENSEUR', 'DEFENDER'], ['CENTRAL / PIVOT', 'CENTRAL / PIVOT'], ['AILIER', 'WINGER'],
    ['FLEXIBLE', 'FLEXIBLE'], ['Pied fort', 'Preferred Foot'], ['DROIT', 'RIGHT'], ['GAUCHE', 'LEFT'], ['Taille (facultatif)', 'Height (optional)'],
    ['Équipe actuelle (facultatif)', 'Current Team (optional)'], ['Ancienne équipe', 'Former Team'], ['Expérience de jeu.', 'Playing Experience.'],
    ["Années de pratique du football", 'Years Playing Football'], ['Plus haut niveau joué', 'Highest Level Played'],
    ['Ligue actuelle (facultatif)', 'Current League (optional)'], ['Clubs précédents', 'Previous Clubs'],
    ['Parle-nous de ton expérience de football', 'Tell us about your football experience'], ["Peux-tu t'engager ?", 'Can You Commit?'],
    ['Es-tu généralement disponible pour les matchs de fin de semaine ?', 'Are you generally available for weekend matches?'],
    ['OUI', 'YES'], ['NON', 'NO'], ['ÇA DÉPEND', 'DEPENDS'], ["DISPONIBILITÉ À L'ENTRAÎNEMENT", 'TRAINING AVAILABILITY'],
    ['Montre-nous ton jeu.', 'Show Us Your Game.'], ['Vidéo YouTube de faits saillants (facultatif)', 'YouTube Highlight Video (optional)'],
    ['Profil Instagram football (facultatif)', 'Instagram Football Profile (optional)'], ['Profil TikTok football (facultatif)', 'TikTok Football Profile (optional)'],
    ['LA VIDÉO EST FACULTATIVE.', 'VIDEO IS OPTIONAL.'], ['Mais elle peut aider notre staff à évaluer ta candidature.', 'But it can help our staff evaluate your application.'],
    ['Avant de postuler.', 'Before You Apply.'], ["Rejoindre YUL FC demande de l'engagement. Les joueurs doivent :", 'Joining YUL FC requires commitment. Players are expected to:'],
    ["Être présents à l'entraînement de façon régulière", 'Attend training consistently'],
    ['Répondre aux disponibilités de match avant les dates limites', 'Respond to match availability before deadlines'],
    ['Communiquer leurs absences', 'Communicate absences'], ['Respecter coéquipiers et staff', 'Respect teammates and staff'],
    ['Respecter les règles du club', 'Respect club rules'], ['Représenter YUL FC dignement', 'Represent YUL FC appropriately'],
    ['Pourquoi veux-tu rejoindre YUL FC ?', 'Why do you want to join YUL FC?'], ['Que recherches-tu dans une équipe ?', 'What are you looking for in a team?'],
    ["Je comprends l'engagement attendu d'un joueur du YUL FC.", 'I understand the commitment expected from a YUL FC player.'],
    ['Vérifie ta candidature.', 'Review Your Application.'], ['Je confirme que les informations fournies sont exactes.', 'I confirm the information provided is accurate.'],
    ['// DÉPARTEMENT DU RECRUTEMENT', '// SCOUTING DEPARTMENT'], ['Candidature', 'Application'], ['Reçue.', 'Received.'],
    ['Ton parcours avec YUL FC commence ici.', 'Your journey with YUL FC starts here.'], ['NUMÉRO DE CANDIDATURE', 'APPLICATION ID'],
    ["CANDIDATURE EN COURS D'ÉVALUATION", 'APPLICATION UNDER REVIEW'], ['ET ENSUITE ?', "WHAT'S NEXT?"],
    ['01 · Notre staff va étudier ta candidature.', '01 · Our staff will review your application.'],
    ['02 · Les profils sélectionnés seront invités aux essais.', '02 · Selected profiles will be invited to tryouts.'],
    ['03 · Tu recevras les informations directement par les coordonnées fournies.', "03 · You'll receive the details directly through the contact info you provided."],
    ['Retour au site', 'Back to the site'], ['Retour', 'Back'], ['Suivant', 'Next'],
    ['// STATUT DE LA CANDIDATURE', '// APPLICATION STATUS'], ['Email utilisé pour la candidature', 'Email used for the application'],
    ['Vérifier le statut', 'Check Status'], ['AUCUNE CANDIDATURE TROUVÉE.', 'NO APPLICATION FOUND.'],
    ["Vérifie l'email utilisé, ou soumets une nouvelle candidature.", 'Check the email you used, or submit a new application.'],
    // Partners
    ['PARTENARIATS', 'PARTNERSHIPS'], ['DEVIENS PARTENAIRE', 'PARTNER'], ['DU YUL FC.', 'WITH YUL FC.'],
    ["Fais partie de l'aventure dès le début.", 'Be part of the journey from the beginning.'],
    ["YUL FC construit un projet sportif moderne, ambitieux et tourné vers l'avenir. Nous recherchons des entreprises qui souhaitent grandir avec le club et faire partie de son histoire dès ses premières étapes.", 'YUL FC is building a modern, ambitious, forward-looking sports project. We are looking for businesses that want to grow with the club and be part of its story from the very first steps.'],
    ['Devenir partenaire', 'Become a Partner'], ['Voir les opportunités', 'Explore Opportunities'], ['Partenaire fondateur', 'Founding Partner'],
    ['Ne commandite pas seulement le club.', "Don't just sponsor the club."], ['Participe à sa construction.', 'Be part of building it.'],
    ['Les premières entreprises qui rejoignent YUL FC auront l\'opportunité d\'être associées aux premières étapes du développement du club. Une opportunité exclusive, sans promesse de chiffres inventés.', "The first businesses to join YUL FC will have the chance to be part of the club's earliest stages of development. An exclusive opportunity, with no made-up numbers promised."],
    ['Construire une association avec YUL FC dès le début', 'Build a partnership with YUL FC from day one'],
    ["Développer une activation adaptée à l'entreprise", 'Develop an activation tailored to your business'],
    ["Visibilité privilégiée possible selon l'entente", 'Premium visibility possible depending on the agreement'],
    ['Création de contenu conjoint', 'Co-created content'], ['Présence digitale', 'Digital presence'], ['Activations Matchday', 'Matchday activations'],
    ["Visibilité sur les équipements selon l'entente", 'Kit visibility depending on the agreement'],
    ['Opportunités de commandite', 'Sponsorship Opportunities'], ['ESPACES DISPONIBLES.', 'SPACES AVAILABLE.'],
    ['DEVANT DU MAILLOT', 'FRONT OF JERSEY'], ['DISPONIBLE', 'AVAILABLE'], ['DOS DU MAILLOT', 'BACK OF JERSEY'], ['MANCHE', 'SLEEVE'],
    ["TENUE D'ENTRAÎNEMENT", 'TRAINING KIT'], ['ONZE DE DÉPART', 'STARTING XI'], ['JOUEUR DU MATCH', 'PLAYER OF THE MATCH'],
    ['CONTENU SOCIAL', 'SOCIAL CONTENT'], ['DEVANT', 'FRONT'], ['DOS', 'BACK'], ['Ta marque avec YUL FC', 'See Your Brand With YUL FC'],
    ['Choisis un emplacement pour voir son statut.', 'Select a placement to see its status.'],
    ['Aperçu de ce que ça pourrait donner : logo fictif, aucun partenaire réel affiché.', 'A preview of what it could look like: mock logo, no real partner shown.'],
    ['APERÇU', 'PREVIEW'], ['présenté par TA MARQUE', 'presented by YOUR BRAND'], ['FIN DU MATCH', 'FULL TIME'],
    ['Nos partenaires', 'Our Partners'], ['NOS PARTENAIRES.', 'OUR PARTNERS.'], ['CONSTRUISONS', "LET'S BUILD"], ['QUELQUE CHOSE ENSEMBLE.', 'SOMETHING TOGETHER.'],
    ["Deviens l'une des premières marques partenaires du YUL FC.", 'Become one of the first brands to partner with YUL FC.'],
    ['Nom', 'Name'], ['Entreprise', 'Company'], ['Message (facultatif)', 'Message (optional)'], ['Téléphone (optionnel)', 'Phone (optional)'], ['Démarrer la conversation', 'Start a Conversation'],
    ['Merci ! Le staff du YUL FC te contactera.', 'Thanks! YUL FC staff will be in touch.'], ['EMBARQUE TÔT.', 'GET IN EARLY.'], ['GRANDIS AVEC YUL FC.', 'GROW WITH YUL FC.'],
    // Fan Zone
    ["C'est ton", 'This Is Your'], ['côté du club.', 'Side Of The Club.'], ['Prédis. Vote. Joue. Suis le YUL FC.', 'Predict. Vote. Play. Follow YUL FC.'],
    ["Gratuit. Sans mise d'argent. Votre engagement compte.", 'Free. No money involved. Your support is what counts.'],
    ['Ton Fan ID YUL', 'Your YUL Fan ID'], ["Choisis un nom d'utilisateur", 'Choose a Username'], ['Obtenir mon Fan ID', 'Get My Fan ID'],
    ["Gratuit · aucune information personnelle requise au-delà du nom d'utilisateur.", 'Free · no personal information required beyond a username.'],
    ['BON RETOUR,', 'WELCOME BACK,'], ['Ton YUL Passport', 'Your YUL Passport'], ['Tampons · Points · Série · Prochaine destination', 'Stamps · Points · Streak · Next Destination'],
    ['Ouvrir le Passport', 'Open Passport'], ['Se déconnecter de ce Fan ID', 'Log out of this Fan ID'], ['ACTIVITÉS', 'ACTIVITIES'],
    ['PRÉDIRE', 'PREDICT'], ['VOTER', 'VOTE'], ['SONDAGES', 'POLLS'], ['CLASSEMENT DES FANS', 'LEADERBOARD'], ['ACTIF', 'ACTIVE'],
    ['Prédis le score', 'Predict The Score'], ['Quiz YUL', 'YUL Quiz'], ['Teste tes connaissances', 'Test your knowledge'],
    ['Classement des fans', 'Fan Leaderboard'], ['Meilleurs supporters', 'Top supporters'], ['Joueur du match des fans', 'Fan Player Of The Match'],
    ['Ouvre après le coup de sifflet final', 'Opens after full time'], ['Sondages des fans', 'Fan Polls'], ['Aucun pour le moment', 'None right now'],
    ['OBTIENS TON FAN ID POUR OUVRIR UN PASSPORT.', 'GET YOUR FAN ID TO OPEN A PASSPORT.'], ['MES TAMPONS', 'MY STAMPS'],
    ['HISTORIQUE DE VOYAGE', 'TRAVEL HISTORY'], ['MA SAISON YUL', 'MY YUL SEASON'], ['SUCCÈS', 'ACHIEVEMENTS'], ['SPÉCIAL', 'SPECIAL'],
    ['Prédis le score.', 'Predict The Score.'], ['OBTIENS TON FAN ID POUR PRÉDIRE.', 'GET YOUR FAN ID TO PREDICT.'],
    ["Gratuit, juste un nom d'utilisateur.", 'Free, just a username needed.'], ['POULS DES FANS', 'FAN PULSE'],
    ['SOIS LE PREMIER À FAIRE TON PRONOSTIC.', 'BE THE FIRST TO MAKE THE CALL.'], ['Joueur du match des fans.', 'Fan Player Of The Match.'],
    ['LE VOTE OUVRE APRÈS LE COUP DE SIFFLET FINAL.', 'VOTING OPENS AFTER FULL TIME.'], ['DONNE TON AVIS', 'HAVE YOUR SAY'],
    ['Teste tes connaissances YUL.', 'Test Your YUL Knowledge.'],
    ['Généré à partir des vraies données du club : effectif et saison actuelle.', "Generated from the club's real data: current squad and season."],
    ['OBTIENS TON FAN ID POUR JOUER.', 'GET YOUR FAN ID TO PLAY.'], ['Sondages YUL.', 'YUL Polls.'], ['AUCUN SONDAGE POUR LE MOMENT.', 'NO POLLS RIGHT NOW.'],
    ['Reviens bientôt.', 'Check back soon.'], ['Classement des fans.', 'Fan Leaderboard.'], ['TON VOTE COMMENCE ICI.', 'YOUR VOTE STARTS HERE.'],
    ['Sois le premier fan YUL au classement.', 'Be the first YUL Fan on the leaderboard.'],
    // Fiche joueur
    ['Nom du joueur', 'Player name'], ['Poste', 'Position'], ['NATIONALITÉ', 'NATIONALITY'], ['ÂGE', 'AGE'], ['TAILLE', 'HEIGHT'],
    ['PIED FORT', 'PREFERRED FOOT'], ['STATS DE LA SAISON', 'SEASON STATS'], ['SAISON 7V7', '7V7 SEASON'], ['DERNIERS MÉDIAS', 'LATEST MEDIA'],
    // Pied de page
    ["L'effectif", 'The Squad'], ['Notre histoire', 'Our story'], ["S'IMPLIQUER", 'GET INVOLVED'], ['Rejoindre YUL FC', 'Join YUL FC'],
    ['Partenariat', 'Partnership'], ['Accès joueurs', 'Player Access'], ['Accès staff', 'Staff Access'],
    ["Né à l'aéroport YUL.", 'Born at YUL airport.'],
    ["Le club a été fondé par Adel Mihoubi avec une idée simple : créer une équipe de football pour les employés de l'aéroport YUL. Le nom vient de là.", 'The club was founded by Adel Mihoubi with a simple idea: to create a football team for YUL airport employees. That is where the name comes from.'],
    ["Avec le temps, l'équipe s'est ouverte à tout le monde, sans perdre ce qui la rend unique : l'identité de l'aéroport et de son univers, qui reste au cœur du club.", 'Over time, the team opened up to everyone without losing what makes it unique: the identity of the airport and its world, which remains at the heart of the club.'],
    ['NOTRE AMBITION', 'OUR AMBITION'], ['Grandir', 'Grow'], ['Faire avancer le club saison après saison, sur le terrain comme en dehors.', 'Move the club forward season after season, on and off the pitch.'],
    ['Être compétitif', 'Be competitive'], ['Viser le plus haut niveau possible à chaque match.', 'Aim for the highest possible level in every match.'],
    ['Gagner des trophées', 'Win trophies'], ["Transformer le travail de l'équipe en titres.", "Turn the team's hard work into titles."],
    ["Un groupe d'amis", 'A group of friends'], ['Avant tout, une équipe soudée qui partage la même passion.', 'Above all, a close-knit team that shares the same passion.'],
    // Match Center sans match programmé
    ['PROCHAIN MATCH · À ANNONCER', 'NEXT MATCH · TO BE ANNOUNCED'],
    ['À venir', 'TBA'],
    ['Aucun match prévu pour le moment. Le prochain match sera annoncé ici.', 'No match scheduled yet. The next match will be announced here.'],
    ['AUCUN MATCH PROGRAMMÉ POUR LE MOMENT.', 'NO MATCHES SCHEDULED YET.'],
    ['Le calendrier sera publié ici dès que les prochains matchs seront connus.', 'The schedule will be posted here as soon as the next matches are known.'],
    ['À annoncer', 'To be announced'],
    ['Prochain match à annoncer', 'Next match to be announced'],
    ['Aucun résultat enregistré', 'No results recorded'],
    ['SAISON 2026 · 7E SUR 11 · QUART DE FINALE DES SÉRIES', '2026 SEASON · 7TH OF 11 · PLAYOFF QUARTER-FINAL'],
    ['SAISON 2025 · 4E SUR 6 · DEMI-FINALE DES SÉRIES', '2025 SEASON · 4TH OF 6 · PLAYOFF SEMI-FINAL'],
    ['LSAQ 11V11 · MONTRÉAL', 'LSAQ 11V11 · MONTRÉAL'],
    ['Saison 2026 · LSAQ 11v11 · saison régulière.', '2026 season · LSAQ 11v11 · regular season.'],
    ['Matchs sans défaite', 'Unbeaten matches'],
    ['Classement final 2026 : 7e sur 11, qualifié pour les séries.', '2026 final table: 7th of 11, qualified for the playoffs.'],
    ['VOIR LE CLASSEMENT', 'SEE THE TABLE'],
    // Partenaires (accueil + page)
    ['Vues Instagram en 30 jours', 'Instagram views in 30 days'],
    ['NOTRE AUDIENCE', 'OUR AUDIENCE'],
    ['// INSTAGRAM · 30 DERNIERS JOURS', '// INSTAGRAM · LAST 30 DAYS'],
    ['Une communauté qui regarde.', 'A community that\'s watching.'],
    ['Vues en 30 jours', 'Views in 30 days'],
    ['Des vues viennent de non-abonnés', 'Of views come from non-followers'],
    ['Visites du profil', 'Profile visits'],
    ['Nouveaux abonnés', 'New followers'],
    ['Vues sur notre meilleure publication', 'Views on our top post'],
    ['Âge de l\'audience', 'Audience age'],
    ['ont entre 18 et 34 ans', 'are aged 18 to 34'],
    ['sont au Canada', 'are in Canada'],
    ['d\'hommes', 'are men'],
    ['Source : statistiques Instagram du club, 30 derniers jours (septembre 2026).', 'Source: the club\'s Instagram insights, last 30 days (September 2026).'],
    ['70,6 %', '70.6%'],
    ['59,1 %', '59.1%'],
    ['19,4 %', '19.4%'],
    ['14,0 %', '14.0%'],
    ['6,5 %', '6.5%'],
    ['78,5 %', '78.5%'],
    ['86,9 %', '86.9%'],
    ['81,7 %', '81.7%'],
    ['1,3 K', '1.3K'],
    ['8 076', '8,076'],
    ['8 000+', '8,000+'],
    ["L'OFFRE", 'THE OFFER'], ['Devenez partenaire fondateur.', 'Become a founding partner.'], ["L'entente est construite sur mesure, selon vos objectifs et votre budget.", 'The agreement is tailor-made around your goals and budget.'],
    ['PARTENAIRES', 'PARTNERS'],
    ['// STATUT FONDATEUR OUVERT', '// FOUNDING STATUS OPEN'],
    ['Votre marque.', 'Your brand.'],
    ['Notre maillot.', 'Our jersey.'],
    ['Associez votre entreprise à un club montréalais qui monte : deux saisons, deux qualifications en séries, et une communauté qui grandit à chaque match.', 'Connect your business with a rising Montréal club: two seasons, two playoff appearances, and a community that grows with every match.'],
    ['Saisons en LSAQ', 'Seasons in the LSAQ'],
    ['Pourquoi nous soutenir', 'Why support us'],
    ['Visibilité terrain', 'On-pitch visibility'],
    ['Présence en ligne', 'Online presence'],
    ['Communauté locale', 'Local community'],
    ['VOTRE', 'YOUR'],
    ['LOGO ICI', 'LOGO HERE'],
    ['// SAISON 2027', '// 2027 SEASON'],
    ['Grandissez', 'Grow'],
    ['avec le', 'with'],
    ['Un club de football compétitif de Montréal, une équipe soudée et des supporters fidèles. Soutenir le YUL FC, c\'est associer votre nom à une histoire qui commence et à des valeurs qui parlent à tout le monde : effort, ambition, esprit d\'équipe.', 'A competitive football club from Montréal, a tight-knit team and loyal supporters. Backing YUL FC means linking your name to a story that is just beginning, and to values everyone understands: effort, ambition, team spirit.'],
    ['Voir les formules', 'See the packages'],
    ['Devant du maillot', 'Front of jersey'],
    ['Contenus « présenté par »', '"Presented by" content'],
    ['Jour de match', 'Matchday'],
    ['Saisons en LSAQ 11v11', 'Seasons in LSAQ 11v11'],
    ['Buts en saison régulière', 'Regular-season goals'],
    ['Site bilingue', 'Bilingual website'],
    ['100 % montréalais', '100% Montréal'],
    ['POURQUOI NOUS SOUTENIR', 'WHY SUPPORT US'],
    ['Quatre bonnes raisons de nous rejoindre.', 'Four good reasons to join us.'],
    ['Une visibilité locale ciblée', 'Targeted local visibility'],
    ['Votre marque devant des joueurs, des familles et des passionnés de soccer de Montréal, chaque fin de semaine, sur le terrain comme en ligne.', 'Your brand in front of Montréal players, families and soccer fans every weekend, on the pitch and online.'],
    ['Un club qui progresse', 'A club on the rise'],
    ['Qualifié pour les séries dès sa saison fondatrice, puis à nouveau en 2026 dans une ligue de 11 équipes. Vous misez sur un projet qui avance.', 'Made the playoffs in its founding season, then again in 2026 in an 11-team league. You are backing a project that keeps moving forward.'],
    ['Un statut de fondateur', 'Founding status'],
    ['Les premières entreprises partenaires restent associées au club comme partenaires fondateurs. Une place dans notre histoire, pas seulement un logo.', 'The first partner businesses stay linked to the club as founding partners. A place in our story, not just a logo.'],
    ['Une image positive', 'A positive image'],
    ['Le sport amateur rassemble. Soutenir une équipe locale, c\'est montrer que votre entreprise s\'implique dans sa communauté.', 'Amateur sport brings people together. Supporting a local team shows your business is involved in its community.'],
    ['CE QUE VOTRE MARQUE OBTIENT', 'WHAT YOUR BRAND GETS'],
    ['Présente partout où le club vit.', 'Present everywhere the club lives.'],
    ['Sur le terrain', 'On the pitch'],
    ['Logo sur le maillot de match ou d\'entraînement', 'Logo on the match or training jersey'],
    ['Bannière les jours de match', 'Matchday banner'],
    ['Présence sur les photos d\'équipe', 'Featured in team photos'],
    ['En ligne', 'Online'],
    ['Logo et lien sur yulfc.com', 'Logo and link on yulfc.com'],
    ['Contenus « présenté par » : jour de match, onze de départ, joueur du match', '"Presented by" content: matchday, starting XI, player of the match'],
    ['Mentions sur les réseaux sociaux du club', 'Mentions on the club\'s social media'],
    ['Avec la communauté', 'With the community'],
    ['Activations sur place avec les supporters', 'On-site activations with supporters'],
    ['Offres ou concours pour les fans', 'Offers or contests for fans'],
    ['Contenu créé ensemble avec les joueurs', 'Content created together with the players'],
    ['LES FORMULES', 'PACKAGES'],
    ['Choisissez votre niveau d\'engagement.', 'Choose your level of commitment.'],
    ['Supporter local', 'Local supporter'],
    ['Pour les commerces du quartier qui veulent soutenir l\'équipe.', 'For neighbourhood businesses that want to back the team.'],
    ['Logo sur la page Partenaires', 'Logo on the Partners page'],
    ['Remerciements sur les réseaux du club', 'Thank-you posts on the club\'s social media'],
    ['Une activation par saison', 'One activation per season'],
    ['En parler', 'Let\'s talk'],
    ['LE PLUS COMPLET', 'MOST COMPLETE'],
    ['Partenaire fondateur', 'Founding partner'],
    ['Pour la marque qui veut être associée au club dès le départ.', 'For the brand that wants to be part of the club from the very start.'],
    ['Logo sur le devant du maillot', 'Logo on the front of the jersey'],
    ['Contenus « présenté par » toute la saison', '"Presented by" content all season'],
    ['Statut de fondateur permanent', 'Permanent founding status'],
    ['Exclusivité dans votre secteur', 'Exclusivity in your industry'],
    ['Réserver ma place', 'Reserve my spot'],
    ['Partenaire officiel', 'Official partner'],
    ['Pour une présence forte sur un espace précis.', 'For a strong presence on one specific placement.'],
    ['Manche, dos ou tenue d\'entraînement', 'Sleeve, back or training kit'],
    ['Chaque entente est construite sur mesure, selon vos objectifs et votre budget.', 'Every agreement is tailor-made around your goals and budget.'],
    ['COMMENT ÇA MARCHE', 'HOW IT WORKS'],
    ['On se parle', 'We talk'],
    ['Vous nous dites ce que vous voulez accomplir. Un message suffit.', 'Tell us what you want to achieve. One message is enough.'],
    ['On construit l\'entente', 'We build the agreement'],
    ['Nous vous proposons une formule claire, adaptée à votre entreprise.', 'We propose a clear package tailored to your business.'],
    ['Votre marque entre en jeu', 'Your brand takes the field'],
    ['Maillot, site, jours de match : votre visibilité démarre avec la saison.', 'Jersey, website, matchdays: your visibility kicks off with the season.'],
    // Placeholders & libellés accessibles
    ['Ouvrir le menu', 'Open menu'], ['Précédent', 'Previous'], ['Suivant', 'Next'], ['Quitter', 'Exit'],
    ['Saison précédente', 'Previous season'], ['Saison suivante', 'Next season'], ['Détails du match', 'Match details'],
    ['Essayer la démo Player Hub', 'Try the Player Hub demo'], ['ex. Ligue provinciale, universitaire...', 'e.g. Provincial league, university...'],
    ['ex. 178 cm', 'e.g. 178 cm'], ['toi@courriel.com', 'you@email.com'], ['ton.email@exemple.com', 'your.email@example.com'],
    ['ACCÈS REQUIS', 'ACCESS REQUIRED'],
    ["Aperçu de l'expérience, authentification réelle à connecter à Supabase Auth.", 'Experience preview, real authentication to be connected to Supabase Auth.'],
    ["Aperçu de l'expérience, rôles et permissions réels à vérifier côté serveur (voir is_staff() dans le schéma).", 'Experience preview, real roles and permissions to be checked server-side (see is_staff() in the schema).'], ["Aperçu de l'expérience", 'Experience preview'],
    ['authentification réelle à connecter à Supabase Auth.', 'real authentication to be connected to Supabase Auth.'],
    ["rôles et permissions réels à vérifier côté serveur (voir is_staff() dans le schéma).", 'real roles and permissions to be checked server-side (see is_staff() in the schema).'],
    ["Le staff publiera la composition depuis Mission Control avant le coup d'envoi.", 'Staff will publish the line-up from Mission Control before kick-off.'],
    ['Les événements du match apparaîtront ici en direct.', 'Match events will appear here live.'],
    ['POSITION À CONFIRMER', 'POSITION TO BE CONFIRMED'], ['Position à confirmer', 'Position to be confirmed'], ['SÉRIES', 'PLAYOFF'], ['MATCHS', 'MATCHES'],
    ['ITINÉRAIRE', 'GET DIRECTIONS'], ['Copier pour Instagram', 'Copy for Instagram'],
    ['ONZE DE DÉPART PAS ENCORE PUBLIÉ.', 'STARTING XI NOT YET PUBLISHED.'], ['AUCUN ÉVÉNEMENT POUR LE MOMENT.', 'NO EVENTS YET.'],
    ['STATS DU MATCH', 'MATCH STATS'], ['STATS NON DISPONIBLES.', 'STATS NOT AVAILABLE.'], ['AUCUN MÉDIA POUR LE MOMENT.', 'NO MEDIA YET.'],
    ['LANGUE / LANGUAGE', 'LANGUE / LANGUAGE'],
    ['Navigation rapide', 'Quick navigation'], ['Zone précédente / suivante', 'Previous / next area'],
  ];

  /* ---------- Règles pour le texte composé (dates, heures...) ---------- */
  const DAYS_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DAYS_FR_S = ['dim','lun','mar','mer','jeu','ven','sam'];
  const DAYS_EN_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const MON_FR_S = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const MON_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MON_EN_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = (arr, v) => arr.findIndex(x => x.toLowerCase() === v.toLowerCase());
  const keepCase = (src, out) => src === src.toUpperCase() && /[A-ZÀ-Ý]/.test(src) ? out.toUpperCase() : out;

  // Règles FR → EN
  const RULES_EN = [
    [/^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi) (\d{1,2}) (\p{L}+)$/iu, (m,d,n,mo) => { const i = idx(MON_FR, mo); return i < 0 ? null : keepCase(m, `${DAYS_EN[idx(DAYS_FR,d)]}, ${MON_EN[i]} ${n}`); }],
    [/^(\d{1,2}) (\p{L}+\.?) (\d{4})$/u, (m,n,mo,y) => { let i = idx(MON_FR_S, mo); if(i < 0) i = idx(MON_FR, mo); return i < 0 ? null : `${MON_EN_S[i]} ${+n}, ${y}`; }],
    [/^(\d{1,2}) h (\d{2})$/, (m,h,mi) => `${h}:${mi}`],
    [/^(dim|lun|mar|mer|jeu|ven|sam)\.? (\d{1,2}:\d{2})$/i, (m,d,t) => keepCase(m, `${DAYS_EN_S[idx(DAYS_FR_S,d)]} ${t}`)],
    [/^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)$/i, (m,d) => keepCase(m, DAYS_EN[idx(DAYS_FR,d)])],
    [/^Journée (\d+)$/i, (m,n) => keepCase(m, `Matchday ${n}`)],
    [/^FORME ACTUELLE · ([VND ]+)$/, (m,f) => 'CURRENT FORM · ' + f.replace(/[VND]/g, c => ({V:'W', N:'D', D:'L'})[c])],
    [/^(?!.* · )(.*\S) (ADVERSAIRE|Adversaire)$/, (m,a,b) => `${a} ${b === 'ADVERSAIRE' ? 'OPPONENT' : 'Opponent'}`],
    [/^(\d+)E$/, (m,n) => n + (n==='1' ? 'ST' : n==='2' ? 'ND' : n==='3' ? 'RD' : 'TH')],
  ];
  // Règles EN → FR
  const RULES_FR = [
    [/^(\d+)(ST|ND|RD|TH)$/, (m,n) => n + (n === '1' ? 'ER' : 'E')],
    [/^(\d+)(ST|ND|RD|TH) ?\/ ?(\d+)$/, (m,n,s,t) => `${n}${n === '1' ? 'ER' : 'E'} / ${t}`],
    [/^OF (\d+) · REGULAR SEASON$/, (m,n) => `SUR ${n} · SAISON RÉGULIÈRE`],
    [/^(\d+) matches$/i, (m,n) => keepCase(m, `${n} matchs`)],
    [/^(\d+) goals$/i, (m,n) => keepCase(m, `${n} buts`)],
    [/^(\d+) assists$/i, (m,n) => keepCase(m, `${n} passes`)],
    [/^(\d+) TIED$/, (m,n) => `${n} À ÉGALITÉ`],
    [/^(\d{4}) (SUMMER|WINTER) joins YUL FC History$/, (m,y,s) => `${y} ${s === 'SUMMER' ? 'ÉTÉ' : 'HIVER'} rejoint l'histoire du YUL FC`],
    [/^YUL FC qualified for the (\d{4}) playoffs$/, (m,y) => `YUL FC qualifié pour les séries ${y}`],
    [/^THE (\d{4}) JOURNEY$/, (m,y) => `LE PARCOURS ${y}`],
    [/^(\d{4}) SEASON$/, (m,y) => `SAISON ${y}`],
    [/^(\d{4}) PLAYER TOTALS$/, (m,y) => `TOTAUX JOUEURS ${y}`],
    [/^(\d{4}) · coming soon$/, (m,y) => `${y} · bientôt`],
    [/^MATCH (\d+)$/, (m,n) => `MATCH ${n}`],
    [/^(\d+) (\w+) · (\d+) goals$/, null],
  ].filter(r => r[1]);

  /* ---------- Moteur ---------- */
  const FR2EN = new Map(), EN2FR = new Map();
  for(const [fr, en] of T){
    if(en === '__YUL_SCOUT_EN__') continue;
    if(fr !== en){ if(!FR2EN.has(fr)) FR2EN.set(fr, en); if(!EN2FR.has(en)) EN2FR.set(en, fr); }
  }
  // La phrase du recrutement est mi-anglaise mi-française à l'origine
  (function(){
    const mixed = T.find(p => p[0].startsWith('YUL FC is looking for players'));
    const fr = T.find(p => p[1] === '__YUL_SCOUT_EN__');
    if(mixed && fr){ EN2FR.set(mixed[0], fr[0]); FR2EN.set(mixed[0], mixed[1]); }
  })();

  function translateWhole(s, lang){
    const map = lang === 'en' ? FR2EN : EN2FR;
    if(map.has(s)) return map.get(s);
    const rules = lang === 'en' ? RULES_EN : RULES_FR;
    for(const [re, fn] of rules){ const m = s.match(re); if(m){ const out = fn(...m); if(out) return out; } }
    return null;
  }
  const SEPS = [' · ', ' · ', ' • '];
  function translate(s, lang, depth=0){
    const w = translateWhole(s, lang);
    if(w !== null) return w;
    if(depth > 2) return s;
    for(const sep of SEPS){
      if(s.includes(sep)){
        const parts = s.split(sep);
        let changed = false;
        const out = parts.map(p => { const t = translate(p, lang, depth+1); if(t !== p) changed = true; return t; });
        if(changed) return out.join(sep);
      }
    }
    return s;
  }

  const ORIG = new WeakMap(), LAST = new WeakMap();
  let lang = 'fr';
  try{ lang = localStorage.getItem('yul-lang') || 'fr'; }catch(e){} // français par défaut
  if(lang !== 'en') lang = 'fr';

  const SKIP = '#missionControl, #playerHub, script, style, noscript, code, .hero-motto, .story-motto, textarea, input, select';
  function doText(node){
    const cur = node.nodeValue;
    if(!ORIG.has(node) || LAST.get(node) !== cur) ORIG.set(node, cur); // texte (re)écrit par le site
    const orig = ORIG.get(node);
    const trimmed = orig.replace(/\s+/g, ' ').trim();
    if(trimmed.length < 2 || (!/\p{L}/u.test(trimmed) && !FR2EN.has(trimmed) && !EN2FR.has(trimmed))){ LAST.set(node, cur); return; }
    const t = translate(trimmed, lang);
    const out = t === trimmed ? orig : orig.match(/^\s*/)[0] + t + orig.match(/\s*$/)[0];
    if(out !== cur) node.nodeValue = out;
    LAST.set(node, node.nodeValue);
  }
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const ORIG_ATTR = new WeakMap();
  function doAttrs(el){
    let o = ORIG_ATTR.get(el);
    for(const a of ATTRS){
      if(!el.hasAttribute(a)) continue;
      if(!o){ o = {}; ORIG_ATTR.set(el, o); }
      const cur = el.getAttribute(a);
      if(!(a in o) || (o['_' + a] !== cur)) o[a] = cur;
      const t = translate(o[a], lang);
      if(t !== cur) el.setAttribute(a, t);
      o['_' + a] = el.getAttribute(a);
    }
  }
  // Libellés de <option> (ne sont pas des nœuds visibles comme les autres)
  function doOption(opt){
    if(!ORIG_ATTR.has(opt)) ORIG_ATTR.set(opt, {txt: opt.textContent, _txt: opt.textContent});
    const o = ORIG_ATTR.get(opt);
    if(o._txt !== opt.textContent) o.txt = opt.textContent;
    const t = translate(o.txt.trim(), lang);
    if(opt.textContent !== t) opt.textContent = t;
    o._txt = opt.textContent;
  }

  function walk(root){
    if(root.nodeType === 3){ if(!root.parentElement || !root.parentElement.closest(SKIP)) doText(root); return; }
    if(root.nodeType !== 1 || root.closest(SKIP.replace(', input, select', ''))) return;
    if(root.matches('input, textarea, img, button, a, [aria-label], [title]')) doAttrs(root);
    root.querySelectorAll('[placeholder], [aria-label], [title], img[alt]').forEach(el => { if(!el.closest('#missionControl, #playerHub')) doAttrs(el); });
    root.querySelectorAll('option').forEach(o => { if(!o.closest('#missionControl, #playerHub')) doOption(o); });
    if(root.tagName === 'OPTION'){ doOption(root); return; }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    let n; while((n = w.nextNode())) doText(n);
  }

  let busy = false;
  function applyAll(){
    busy = true;
    document.documentElement.lang = lang;
    walk(document.body);
    // titre de l'onglet
    const tt = document.title.split(' · ');
    if(tt.length === 2){ const t = translate(tt[0], lang); if(t !== tt[0]) document.title = t + ' · ' + tt[1]; }
    if(typeof mo !== 'undefined') mo.takeRecords();
    busy = false;
    document.querySelectorAll('.lang-switch button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
  }

  // Contenu ajouté ou modifié par le site → traduit à la volée
  const pending = new Set(), attrPending = new Set(); let scheduled = false;
  const mo = new MutationObserver(muts => {
    if(busy) return;
    for(const m of muts){
      if(m.type === 'characterData') pending.add(m.target);
      else if(m.type === 'attributes') attrPending.add(m.target);
      else m.addedNodes.forEach(n => pending.add(n));
    }
    if(!scheduled){
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false; busy = true;
        pending.forEach(n => { if(n.isConnected) walk(n); });
        attrPending.forEach(el => { if(el.isConnected && !el.closest('#missionControl, #playerHub')) doAttrs(el); });
        pending.clear(); attrPending.clear();
        mo.takeRecords(); busy = false;
      });
    }
  });

  /* ---------- Sélecteur FR | EN ---------- */
  function makeSwitch(extraClass){
    const w = document.createElement('div');
    w.className = 'lang-switch ' + (extraClass || '');
    w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Langue / Language');
    w.innerHTML = '<button type="button" data-lang="fr" lang="fr">FR</button><button type="button" data-lang="en" lang="en">EN</button>';
    w.addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return;
      setLang(b.dataset.lang);
    });
    return w;
  }
  function setLang(l){
    if(l !== 'fr' && l !== 'en') return;
    lang = l;
    try{ localStorage.setItem('yul-lang', l); }catch(e){}
    applyAll();
    window.dispatchEvent(new CustomEvent('yul:lang', {detail:{lang:l}}));
  }

  function init(){
    const header = document.querySelector('header');
    const menuBtn = document.getElementById('menuBtn');
    if(header){
      const sw = makeSwitch('in-header');
      if(menuBtn) header.insertBefore(sw, menuBtn); else header.appendChild(sw);
    }
    const mm = document.querySelector('#mobileMenu .mm-inner');
    if(mm){
      const row = document.createElement('div'); row.className = 'mm-lang';
      row.innerHTML = '<span class="mobile-menu-head">LANGUE / LANGUAGE</span>';
      row.appendChild(makeSwitch('in-menu'));
      mm.appendChild(row);
    }
    applyAll();
    mo.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['placeholder','aria-label','title']});
    // le routeur change le titre de l'onglet
    window.addEventListener('yul:page', () => requestAnimationFrame(applyAll));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.YULi18n = { set: setLang, get: () => lang, t: (s) => translate(s, lang) };
})();
