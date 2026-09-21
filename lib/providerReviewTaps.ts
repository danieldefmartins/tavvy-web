export type ProviderTapKind='pro'|'realtor';
export type ProviderTapDimension='main'|'good'|'vibe'|'heads_up';
export type ProviderTapChoice={code:string;label:string};
export const PROVIDER_TAPS:Record<ProviderTapKind,Record<ProviderTapDimension,ProviderTapChoice[]>>={
  pro:{
    main:[{code:'quality_of_work',label:'Quality of work'},{code:'problem_solved',label:'Problem solved'},{code:'reliability',label:'Reliability'},{code:'service_result',label:'Service result'}],
    good:[{code:'skill',label:'Skilled'},{code:'communication',label:'Clear communication'},{code:'punctuality',label:'On time'},{code:'follow_through',label:'Followed through'}],
    vibe:[{code:'friendly',label:'Friendly'},{code:'careful',label:'Careful'},{code:'efficient',label:'Efficient'},{code:'patient',label:'Patient'},{code:'professional',label:'Professional'}],
    heads_up:[{code:'delays',label:'Delays'},{code:'availability',label:'Limited availability'},{code:'unexpected_costs',label:'Unexpected costs'},{code:'cleanup',label:'Cleanup concern'}],
  },
  realtor:{
    main:[{code:'market_guidance',label:'Market guidance'},{code:'negotiation',label:'Negotiation'},{code:'transaction_support',label:'Transaction support'},{code:'finding_home',label:'Finding the right home'}],
    good:[{code:'local_knowledge',label:'Local knowledge'},{code:'communication',label:'Clear communication'},{code:'follow_through',label:'Followed through'},{code:'attention_to_detail',label:'Attention to detail'}],
    vibe:[{code:'hands_on',label:'Hands-on'},{code:'calm',label:'Calm'},{code:'direct',label:'Direct'},{code:'friendly',label:'Friendly'},{code:'proactive',label:'Proactive'}],
    heads_up:[{code:'slow_updates',label:'Slow updates'},{code:'availability',label:'Limited availability'},{code:'pressure',label:'Felt pressured'},{code:'unexpected_costs',label:'Unexpected costs'}],
  },
};
export const providerTapLabel=(kind:ProviderTapKind,dimension:ProviderTapDimension,code:string|null|undefined)=>code?PROVIDER_TAPS[kind][dimension].find(c=>c.code===code)?.label:null;
