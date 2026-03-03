import {
  AnalysisRequest,
  AnalysisResult,
  FatigueDiagnosis,
  FatigueLevel,
  Recommendation
} from '@/types';

// Analyze creative fatigue based on performance metrics and feedback
export function analyzeFatigue(request: AnalysisRequest): FatigueDiagnosis {
  const { performanceMetrics, feedbackData } = request;

  let fatigueScore = 0;
  const reasons: string[] = [];

  // CTR decline analysis
  if (performanceMetrics.ctr < 1) {
    fatigueScore += 30;
    reasons.push('Low click-through rate indicates declining engagement');
  }

  // Duration-based fatigue
  if (performanceMetrics.durationDays > 14) {
    fatigueScore += 25;
    reasons.push('Ad has been running for extended period');
  }

  // Cost efficiency
  if (performanceMetrics.cpc > 2) {
    fatigueScore += 20;
    reasons.push('Rising cost-per-click suggests diminishing returns');
  }

  // Conversion performance
  const conversionRate = (performanceMetrics.conversions / performanceMetrics.clicks) * 100;
  if (conversionRate < 2) {
    fatigueScore += 15;
    reasons.push('Low conversion rate indicates messaging misalignment');
  }

  // Sentiment analysis
  if (feedbackData?.sentiment === 'negative') {
    fatigueScore += 10;
    reasons.push('Negative user sentiment detected in feedback');
  }

  // Determine fatigue level
  let level: FatigueLevel;
  if (fatigueScore >= 70) level = 'critical';
  else if (fatigueScore >= 50) level = 'high';
  else if (fatigueScore >= 30) level = 'moderate';
  else level = 'low';

  return {
    level,
    confidence: Math.min(fatigueScore / 100, 0.95),
    primaryReasons: reasons.slice(0, 3),
    impactScore: fatigueScore,
  };
}

// Generate prioritized recommendations
export function generateRecommendations(
  diagnosis: FatigueDiagnosis,
  request: AnalysisRequest
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { performanceMetrics, adInput, feedbackData } = request;

  // Creative refresh recommendation
  if (diagnosis.level === 'high' || diagnosis.level === 'critical') {
    recommendations.push({
      id: 'rec-1',
      priority: 'high',
      category: 'creative',
      title: 'Refresh Visual Creative',
      description: 'Your ad creative shows signs of significant fatigue. Users may be experiencing banner blindness.',
      actionItems: [
        'Create 2-3 new visual variations with different layouts',
        'Test different color schemes and imagery',
        'Update design elements to stand out from previous versions',
      ],
      expectedImpact: 'CTR improvement of 15-30%',
      estimatedEffort: 'medium',
    });
  }

  // Messaging update recommendation
  if (performanceMetrics.ctr < 1.5) {
    recommendations.push({
      id: 'rec-2',
      priority: 'high',
      category: 'messaging',
      title: 'Revise Ad Copy and Headline',
      description: 'Your messaging may not be resonating with the target audience.',
      actionItems: [
        'Rewrite headline to focus on primary benefit',
        'Simplify ad copy to reduce cognitive load',
        'Test different value propositions',
        'Ensure CTA is clear and action-oriented',
      ],
      expectedImpact: 'Improved engagement and conversion rate',
      estimatedEffort: 'low',
    });
  }

  // CTA optimization
  if (performanceMetrics.conversions < 10) {
    recommendations.push({
      id: 'rec-3',
      priority: 'medium',
      category: 'messaging', // Kept messaging as it's a valid category
      title: 'Optimize Call-to-Action',
      description: 'Low conversion numbers suggest your CTA may need strengthening.',
      actionItems: [
        'Make CTA more specific and urgent',
        'Test different action verbs (Get, Start, Claim, etc.)',
        'Add scarcity or urgency elements if appropriate',
      ],
      expectedImpact: 'Conversion rate improvement of 10-20%',
      estimatedEffort: 'low',
    });
  }

  // Cost Per Acquisition check
  if (performanceMetrics.cpa > 100) {
    recommendations.push({
      id: 'rec-4',
      priority: 'high',
      category: 'budget',
      title: 'Review Acquisition Costs',
      description: 'CPA is currently extremely high relative to typical baseline.',
      actionItems: [
        'Review conversion funnel drop-offs',
        'Check for tracking pixel issues',
        'Tighten audience constraints to higher-intent users'
      ],
      expectedImpact: 'CPA reduction by 15-30%',
      estimatedEffort: 'medium'
    });
  }

  // Frequency Saturation check
  if (performanceMetrics.frequency > 4) {
    recommendations.push({
      id: 'rec-5',
      priority: 'medium',
      category: 'targeting',
      title: 'Address Audience Saturation',
      description: 'Ad frequency is getting high, suggesting the current audience pool is exhausted.',
      actionItems: [
        'Exclude past purchasers/converters',
        'Expand lookalike audience percentage',
        'Refresh creative to combat ad blindness'
      ],
      expectedImpact: 'Stabilize rising CPMs and CTR decay',
      estimatedEffort: 'medium'
    })
  }

  // Audience feedback integration
  if (feedbackData && feedbackData.commonThemes.length > 0) {
    recommendations.push({
      id: 'rec-4',
      priority: 'medium',
      category: 'messaging',
      title: 'Address User Feedback Themes',
      description: `User feedback reveals common themes: ${feedbackData.commonThemes.join(', ')}`,
      actionItems: [
        'Review negative feedback for clarity issues',
        'Address objections directly in ad copy',
        'Incorporate positive feedback elements',
      ],
      expectedImpact: 'Better audience alignment and trust',
      estimatedEffort: 'medium',
    });
  }

  // Format/platform recommendation
  if (performanceMetrics.durationDays > 21) {
    recommendations.push({
      id: 'rec-5',
      priority: 'low',
      category: 'format',
      title: 'Test Alternative Ad Formats',
      description: 'Consider testing different ad formats to combat fatigue.',
      actionItems: [
        'Try video ads if currently using static images',
        'Test carousel format for storytelling',
        'Experiment with interactive elements',
      ],
      expectedImpact: 'Fresh engagement from existing audience',
      estimatedEffort: 'high',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Main analysis function
export function performAnalysis(request: AnalysisRequest): AnalysisResult {
  const diagnosis = analyzeFatigue(request);
  const recommendations = generateRecommendations(diagnosis, request);

  let summary = '';
  if (diagnosis.level === 'critical') {
    summary = 'Your ad shows critical fatigue. Immediate creative refresh recommended to prevent further performance decline.';
  } else if (diagnosis.level === 'high') {
    summary = 'High fatigue detected. Plan creative updates within the next few days to maintain performance.';
  } else if (diagnosis.level === 'moderate') {
    summary = 'Moderate fatigue observed. Consider preparing refresh variants while monitoring performance.';
  } else {
    summary = 'Ad is performing within normal parameters. Continue monitoring for early fatigue signs.';
  }

  return {
    adId: request.adInput.id,
    fatigueDiagnosis: diagnosis,
    recommendations,
    summary,
    timestamp: new Date(),
  };
}
