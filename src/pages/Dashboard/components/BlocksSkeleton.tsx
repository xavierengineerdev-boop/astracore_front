import React from 'react'
import { Paper, Skeleton, Grid } from '@mui/material'
import { cardPaperSx } from '../constants'

const BlocksSkeleton: React.FC = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Grid key={i} size={{ xs: 12, md: 6 }}>
        <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 200 }}>
          <Skeleton width="40%" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.08)', mb: 2 }} />
          <Skeleton width="100%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Skeleton width="90%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Skeleton width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        </Paper>
      </Grid>
    ))}
  </Grid>
)

export default BlocksSkeleton
