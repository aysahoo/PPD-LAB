import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { enqueueSnackbar } from 'notistack'
import {
  Badge,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Popover,
  Typography,
} from '@mui/material'

import { useAuth } from '@/contexts/auth-context'
import { fetchNotifications, markNotificationRead } from '@/lib/notifications-api'
import * as storage from '@/lib/auth-storage'
import type { NotificationDto } from '@/types/notification'

export function NotificationMenu() {
  const { user, loading } = useAuth()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [items, setItems] = useState<NotificationDto[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const token = storage.getToken() ?? ''

  const load = useCallback(async () => {
    if (!token) return
    setLoadingList(true)
    try {
      const list = await fetchNotifications(token)
      setItems(list)
    } catch (e) {
      enqueueSnackbar(e instanceof Error ? e.message : 'Failed to load notifications', { variant: 'error' })
    } finally {
      setLoadingList(false)
    }
  }, [token])

  useEffect(() => {
    if (!token || !user) return
    void load()
  }, [token, user?.id, load, user])

  useEffect(() => {
    if (!anchorEl || !token) return
    void load()
  }, [anchorEl, token, load])

  if (loading || !user || !token) return null

  const unread = items.filter((n) => !n.read).length
  const open = Boolean(anchorEl)

  async function onMarkRead(id: number) {
    try {
      await markNotificationRead(token, id)
      enqueueSnackbar('Marked as read', { variant: 'success' })
      await load()
    } catch (e) {
      enqueueSnackbar(e instanceof Error ? e.message : 'Failed to update', { variant: 'error' })
    }
  }

  return (
    <Box>
      <IconButton
        type="button"
        size="small"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ border: 1, borderColor: 'divider', position: 'relative' }}
      >
        <Badge
          color="primary"
          badgeContent={unread > 0 ? (unread > 9 ? '9+' : unread) : 0}
          invisible={unread === 0}
          sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16, px: 0.5 } }}
        >
          <Bell size={18} aria-hidden />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 320, maxWidth: 'calc(100vw - 2rem)' } } }}
      >
        <Paper elevation={0} sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, display: 'block', mb: 1 }}>
            Notifications
          </Typography>
          {loadingList ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              Loading…
            </Typography>
          ) : null}
          {!loadingList && items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No notifications.
            </Typography>
          ) : null}
          <List dense disablePadding sx={{ maxHeight: 288, overflow: 'auto' }}>
            {items.map((n) => (
              <ListItem
                key={n.id}
                alignItems="flex-start"
                sx={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  py: 1,
                  px: 1.5,
                  opacity: n.read ? 0.7 : 1,
                }}
              >
                <ListItemText
                  primaryTypographyProps={{ variant: 'body2', sx: { whiteSpace: 'pre-wrap' } }}
                  primary={n.body}
                  secondary={n.type ?? undefined}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
                {!n.read ? (
                  <Button size="small" sx={{ alignSelf: 'flex-start', mt: 0.5 }} onClick={() => void onMarkRead(n.id)}>
                    Mark read
                  </Button>
                ) : null}
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </Box>
  )
}
