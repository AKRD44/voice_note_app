# VoiceFlow - Design Style Guide

## Design Philosophy

### Visual Language
**Modern Minimalism with Premium Feel**
- Clean interfaces with generous white space
- Subtle gradients and glassmorphism effects
- Micro-interactions that delight users
- Dark mode support with elegant transitions
- Premium typography and attention to detail

### Color Palette
**Primary Colors**
- **Deep Slate**: `#1e293b` (primary text, dark mode backgrounds)
- **Soft White**: `#fafafa` (light mode backgrounds)
- **Accent Blue**: `#3b82f6` (primary actions, links)
- **Success Green**: `#10b981` (completion states)

**Secondary Colors**
- **Warm Gray**: `#6b7280` (secondary text)
- **Light Gray**: `#f1f5f9` (subtle backgrounds)
- **Warning Amber**: `#f59e0b` (alerts, warnings)
- **Error Red**: `#ef4444` (errors, destructive actions)

**Gradient Combinations**
- **Primary Gradient**: `linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)`
- **Glass Gradient**: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`
- **Background Gradient**: `radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1), transparent 50%)`

### Typography
**Primary Font**: Inter (sans-serif)
- **Display**: Inter Bold 48px-32px (headlines, hero text)
- **Heading**: Inter SemiBold 24px-18px (section titles)
- **Body**: Inter Regular 16px-14px (main content)
- **Caption**: Inter Medium 12px (labels, metadata)

**Secondary Font**: Geist Mono (monospace)
- **Code**: Geist Mono Regular 14px (transcripts, technical text)
- **Numbers**: Geist Mono Medium (timers, counters)

### Visual Effects & Animations

#### Background Effects
**Aurora Gradient Flow**
- Animated gradient background with subtle movement
- Colors: Soft blues and purples with low saturation
- Animation: Slow, continuous flow (60s duration)
- Implementation: CSS animations with keyframes

**Glassmorphism Cards**
- backdrop-filter: blur(20px)
- Background: rgba(255, 255, 255, 0.1)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)

#### Text Effects
**Gradient Text Animation**
- Animated gradient on key headlines
- Colors: Primary gradient colors
- Animation: 3s ease-in-out infinite alternate

**Shimmer Effect**
- Loading states for text content
- Subtle shimmer animation across text
- Color: rgba(255, 255, 255, 0.3)

#### Interactive Effects
**Button Hover States**
- Scale transform: scale(1.05)
- Box-shadow: Enhanced shadow on hover
- Transition: all 0.2s ease-in-out

**Card Hover Effects**
- Transform: translateY(-4px)
- Box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1)
- Transition: all 0.3s ease-in-out

### Component Library Integration

#### shadcn/ui Components
**Button Variants**
- Primary: Gradient background with white text
- Secondary: Glassmorphism with border
- Ghost: Transparent with hover background
- Destructive: Error red with white text

**Card Components**
- Default: Glassmorphism with subtle border
- Hover: Lift effect with enhanced shadow
- Content: Proper padding and typography hierarchy

**Form Elements**
- Input: Glassmorphism with focus states
- Select: Custom dropdown with smooth animations
- Toggle: Smooth slide animation with brand colors

#### Custom Components
**Recording Button**
- Large circular design (120px diameter)
- Gradient border with pulse animation
- Microphone icon with scale transform
- States: Idle, Recording, Paused, Processing

**Waveform Visualization**
- Animated bars responding to audio levels
- Gradient colors matching brand palette
- Smooth height transitions with CSS animations
- Responsive design for mobile and desktop

**Text Editor**
- Clean, minimal interface
- Floating toolbar with glassmorphism effect
- Auto-save indicator with checkmark animation
- Syntax highlighting for different text styles

### Layout & Spacing

#### Grid System
**Desktop Layout**
- 12-column grid with 24px gutters
- Max-width: 1200px centered
- Responsive breakpoints: 768px, 1024px, 1440px

**Mobile Layout**
- Single column with 16px margins
- Touch-friendly minimum sizes (44px)
- Bottom navigation with safe area padding

#### Spacing Scale
- xs: 4px (fine details)
- sm: 8px (tight spacing)
- md: 16px (standard spacing)
- lg: 24px (section spacing)
- xl: 32px (major sections)
- 2xl: 48px (page sections)

### Iconography

#### Icon Style
- **Library**: Lucide React icons
- **Style**: Outlined, consistent stroke width (2px)
- **Size**: 16px, 20px, 24px, 32px scale
- **Color**: Inherits text color or brand colors

#### Custom Icons
- Microphone: Custom design with gradient fill
- Waveform: Animated bars with audio response
- Processing: Spinner with brand gradient
- Success: Checkmark with green accent

### Dark Mode Design

#### Color Adaptations
- **Background**: `#0f172a` (deep slate)
- **Surface**: `#1e293b` (elevated elements)
- **Text**: `#f8fafc` (high contrast)
- **Secondary**: `#94a3b8` (reduced contrast)

#### Effect Adjustments
- **Glassmorphism**: Darker rgba values
- **Gradients**: Adjusted brightness for dark theme
- **Shadows**: Reduced intensity, adjusted colors
- **Borders**: Lighter rgba values for visibility

### Responsive Design

#### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

#### Component Adaptations
- **Navigation**: Bottom tabs (mobile) vs sidebar (desktop)
- **Cards**: Single column (mobile) vs grid (desktop)
- **Typography**: Scaled font sizes across breakpoints
- **Spacing**: Adjusted margins and padding for each screen size

### Accessibility Considerations

#### Color Contrast
- **Text**: Minimum 4.5:1 ratio (WCAG AA)
- **Interactive**: Minimum 3:1 ratio for UI elements
- **Focus**: High contrast focus indicators

#### Motion & Animation
- **Reduced Motion**: Respect prefers-reduced-motion
- **Duration**: Keep animations under 300ms
- **Easing**: Use ease-in-out for natural feel

#### Touch Targets
- **Minimum Size**: 44px x 44px for mobile
- **Spacing**: 8px minimum between touch targets
- **Feedback**: Visual and haptic feedback for interactions