import { z } from 'zod'

export const ActionItemSchema = z.object({
  text: z.string(),
  assignee: z.string().optional(),
})

export const InsightsSchema = z.object({
  title: z.string(),
  emoji: z.string(),
  polished: z.string(),
  summary: z.string(),
  actionItems: z.array(ActionItemSchema),
  keyDecisions: z.array(z.string()),
  tags: z.array(z.string()),
})

export type ActionItem = z.infer<typeof ActionItemSchema>
export type Insights = z.infer<typeof InsightsSchema>
