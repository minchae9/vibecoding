import './globals.css'

export const metadata = {
  title: 'Health Buddy - AI 건강 관리',
  description: 'AI 기반 건강 의사결정 지원 서비스',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
