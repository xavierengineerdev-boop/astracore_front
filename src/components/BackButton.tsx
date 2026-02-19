import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const HAS_NAVIGATED_KEY = 'astracore_has_navigated'

export interface BackButtonProps {
  /** Текст кнопки (по умолчанию "Назад") */
  children?: React.ReactNode
  /** Куда перейти, если в истории нет предыдущей страницы (например, открыли по прямой ссылке) */
  fallbackTo?: string
  sx?: React.ComponentProps<typeof Button>['sx']
}

/**
 * Кнопка «Назад»: возврат по истории браузера (на ту страницу, с которой пришли).
 * При первом заходе (ещё не было переходов внутри приложения) не выходит с сайта — остаётся на странице или переходит на fallbackTo.
 */
const BackButton: React.FC<BackButtonProps> = ({ children = 'Назад', fallbackTo = '/', sx }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackPath = fallbackTo.split('?')[0]

  const handleBack = () => {
    const hasNavigated = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(HAS_NAVIGATED_KEY)
    // Первый заход: пользователь ещё не переходил по ссылкам внутри приложения — не уходить с сайта.
    if (!hasNavigated) {
      const currentPath = location.pathname
      if (currentPath === fallbackPath || (fallbackPath === '/' && currentPath === '/')) {
        return // уже на fallback, ничего не делаем
      }
      navigate(fallbackTo)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallbackTo)
    }
  }

  return (
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={handleBack}
      sx={{ color: 'rgba(196,181,253,0.9)', ...sx }}
    >
      {children}
    </Button>
  )
}

export default BackButton
