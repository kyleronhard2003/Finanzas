const PAGE_FILE = 'pagos.html';
// ================= UTILIDADES =================
const __missingElement = new Proxy({
  style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, dataset:{}, options:[], value:'', checked:false, disabled:false, files:[]
},{get(t,p){
  if(p in t) return t[p];
  if(p==='addEventListener'||p==='removeEventListener'||p==='click'||p==='focus'||p==='blur'||p==='select') return ()=>{};
  if(p==='closest'||p==='querySelector') return ()=>null;
  if(p==='querySelectorAll') return ()=>[];
  if(p==='getContext') return ()=>null;
  return undefined;
},set(){return true;}});
const $ = id => document.getElementById(id) || __missingElement;
const LS_KEY = 'misFinanzas_v2';
const fmt = n => new Intl.NumberFormat(LOCALE(),{style:'currency',currency:(typeof db!=='undefined'&&db&&db.moneda)?db.moneda:'EUR'}).format(n);
const fmtFechaCorta = iso => { if(!iso) return '—'; const d=new Date(iso.length===10?iso+'T12:00:00':iso); const p=n=>String(n).padStart(2,'0'); return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(2); };
const fmtFecha = iso => { if(!iso) return '—'; const d=new Date(iso.length===10?iso+'T12:00:00':iso); return d.toLocaleDateString(LOCALE(),{day:'2-digit',month:'2-digit',year:'numeric'}); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const hoyISO = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let movLimit = 10; // filas visibles en el historial de movimientos
const DB_DEFAULTS = { movimientos:[], cobros:[], metas:[], prestamos:[], prestamoPagos:[], presupuestos:[], theme:'dark', moneda:'EUR', lang:'es', divisaFavoritas:['USD','GBP','JPY'], profilePhoto:'' };
function cargarDB(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw) return {...DB_DEFAULTS, divisaFavoritas:[...DB_DEFAULTS.divisaFavoritas]};
    const parsed=JSON.parse(raw);
    return parsed && typeof parsed==='object' && !Array.isArray(parsed) ? parsed : {...DB_DEFAULTS, divisaFavoritas:[...DB_DEFAULTS.divisaFavoritas]};
  }catch(_){
    return {...DB_DEFAULTS, divisaFavoritas:[...DB_DEFAULTS.divisaFavoritas]};
  }
}
function normalizarDB(data){
  const out=(data && typeof data==='object' && !Array.isArray(data)) ? data : {};
  if(!Array.isArray(out.movimientos)) out.movimientos=[];
  if(!Array.isArray(out.cobros)) out.cobros=[];
  if(!Array.isArray(out.metas)) out.metas=[];
  if(!Array.isArray(out.prestamos)) out.prestamos=[];
  if(!Array.isArray(out.prestamoPagos)) out.prestamoPagos=[];
  if(!Array.isArray(out.presupuestos)) out.presupuestos=[];
  out.metas=out.metas.map(g=>({id:g.id||uid(),nombre:String(g.nombre||'').trim(),objetivo:Number(g.objetivo)||0,fechaObjetivo:g.fechaObjetivo||null,ahorrado:Math.max(0,Number(g.ahorrado)||0)}));
  out.prestamos=out.prestamos.map(p=>({id:p.id||uid(),nombre:String(p.nombre||'').trim(),montoTotal:Number(p.montoTotal)||0,cuotasTotal:Math.max(1,parseInt(p.cuotasTotal)||1),montoCuota:Number(p.montoCuota)||0,diaPago:Math.max(1,Math.min(31,parseInt(p.diaPago)||1)),fechaInicio:p.fechaInicio||hoyISO(),pagadas:Math.max(0,Math.min(parseInt(p.pagadas)||0,parseInt(p.cuotasTotal)||1))}));
  out.presupuestos=out.presupuestos.map(p=>({id:p.id||uid(),categoria:String(p.categoria||'').trim(),limite:Number(p.limite)||0})).filter(p=>p.categoria&&p.limite>0);
  if(out.theme!=='dark' && out.theme!=='light') out.theme='dark';
  if(!['EUR','USD','PHP'].includes(String(out.moneda||'').toUpperCase())) out.moneda='EUR';
  out.moneda=String(out.moneda).toUpperCase();
  if(out.lang!=='es' && out.lang!=='en') out.lang='es';
  if(!Array.isArray(out.divisaFavoritas)) out.divisaFavoritas=[...DB_DEFAULTS.divisaFavoritas];
  if(typeof out.profilePhoto!=='string') out.profilePhoto='';
  return out;
}
let db = normalizarDB(cargarDB());

// ================= IDIOMAS (ES / EN) =================
const I18N = {
es: {
brand:"Mis Finanzas", nav_panel:"📊 Panel", nav_movs:"💸 Movimientos", nav_cobros:"💳 Cobros y préstamos", nav_metas:"🎯 Metas", nav_ajustes:"⚙️ Ajustes",
nav_panel_s:"Panel", nav_movs_s:"Regis.", nav_pagos_s:"Pagos", nav_metas_s:"Metas", nav_fx_s:"Divisas", nav_fx:"💱 Divisas",
kpi_balance:"💼 Balance total", kpi_income:"📈 Ingresos este mes", kpi_expense:"📉 Gastos este mes", kpi_due:"⏰ Cobros próximos", kpi_after_due:"💰 Saldo después de cobrar", kpi_after_due_sub:"Después de todos los cobros próximos",
ch_6m:"Últimos 6 meses", ch_by_cat:"Gastos por categoría (este mes)", leg_income:"Ingresos", leg_expense:"Gastos",
p_recent:"🕐 Últimos movimientos", p_bills:"⏰ Cobros programados", p_goals:"🎯 Metas", p_loans:"🏦 Préstamos", p_topcat:"🏆 Top categorías de gasto (este mes)",
no_tx_yet:"Sin movimientos todavía", no_bills:"No tienes cobros programados", no_goals:"No tienes metas creadas", no_loans:"No tienes préstamos registrados", no_exp_month:"Sin gastos este mes",
v_movs_title:"💸 Ingresos y gastos", btn_new_tx:"＋ Nuevo movimiento", hist_filters:"Historial y filtros", ph_search:"🔍 Buscar…", opt_all:"Todos", opt_income:"Ingresos", opt_expense:"Gastos", all_months:"Todos los meses",
th_cat:"Categoría", th_date:"Fecha", th_amount:"Monto", no_results:"Sin resultados", k_results:"resultado(s)", k_net:"Neto:", show_more:"▼ Mostrar más (", remaining:" restantes)", show_less:"▲ Mostrar menos",
frm_new_tx:"Nuevo movimiento", frm_edit_tx:"Editar movimiento", editing_tx:"✏️ Editando movimiento", cancel_edit:"cancelar edición",
lbl_type:"Tipo", lbl_amount:"Monto", lbl_category:"Categoría", lbl_description:"Descripción", lbl_date:"Fecha",
opt_inc_s:"📈 Ingreso", opt_exp_s:"📉 Gasto", save_tx:"Guardar movimiento", update_tx:"Actualizar movimiento", ph_cats:"ej. Comida, Sueldo, Transporte…", ph_detail:"Detalle (opcional)",
v_cobros_title:"💳 Pagos y préstamos", btn_new_bill:"＋ Nuevo cobro", scheduled_bills:"Cobros programados", th_concept:"Concepto", th_next:"Próximo",
frm_new_bill:"Nuevo cobro programado", frm_edit_bill:"Editar cobro", editing_bill:"✏️ Editando cobro", cancel:"cancelar",
lbl_concept:"Concepto", lbl_start:"Fecha de inicio", lbl_time:"Hora", lbl_repeats:"Se repite", f_unico:"Solo una vez", f_mensual:"Cada mes", f_semanal:"Cada semana", f_anual:"Cada año",
schedule_bill:"Programar cobro", update_bill:"Actualizar cobro", ph_bill:"ej. Netflix, Alquiler, Luz…",
loans_title:"🏦 Préstamos y cuotas", btn_new_loan:"＋ Nuevo préstamo", my_loans:"Mis préstamos",
frm_new_loan:"Nuevo préstamo", frm_edit_loan:"Editar préstamo", editing_loan:"✏️ Editando préstamo",
lbl_name:"Nombre / entidad", lbl_total:"Monto total (€)", lbl_ninst:"Nº de cuotas", lbl_per_inst:"Monto por cuota (€)", lbl_payday:"Día de pago mensual", lbl_first_date:"Fecha de la primera cuota",
ph_loan:"ej. Préstamo coche — BBVA", ph_day5:"ej. 5", register_loan:"Registrar préstamo", update_loan:"Actualizar préstamo",
metas_title:"🎯 Metas de ahorro", btn_new_goal:"＋ Nueva meta", my_goals:"Mis metas",
frm_new_goal:"Nueva meta", frm_edit_goal:"Editar meta", editing_goal:"✏️ Editando meta",
lbl_goal_name:"Nombre de la meta", lbl_target:"Monto objetivo (€)", lbl_target_date:"Fecha objetivo (opcional)", ph_goal:"ej. Viaje a Japón", create_goal:"Crear meta", update_goal:"Actualizar meta",
det_tx:"💸 Detalle del movimiento", d_description:"Descripción", det_bill:"💳 Detalle del cobro", det_goal:"🎯 Detalle de la meta",
d_type:"Tipo", d_repeats:"Se repite", d_next:"Próxima fecha", d_status:"Estado", d_goal:"Meta", d_saved:"Ahorrado", d_target2:"Objetivo", d_progress:"Progreso", d_missing:"Falta", d_target_date:"Fecha objetivo",
no_description:"Sin descripción", active:"● Activo", paused:"⏸ Pausado", edit:"✏️ Editar", delete:"🗑️ Eliminar", pause:"⏸ Pausar", resume:"▶ Activar", add:"＋ Aportar", withdraw:"− Retirar",
t_ingreso:"ingreso", t_gasto:"gasto",
set_title:"⚙️ Ajustes y datos", set_profile:"👤 Perfil", set_profile_photo:"Foto de perfil", set_profile_desc:"Sube una foto para mostrarla en el encabezado. Se guarda únicamente en este dispositivo.", profile_upload:"Subir foto", profile_remove:"Quitar", set_theme:"🎨 Tema", set_theme_desc:"Elige entre tema oscuro o claro.", loan_basic:"Datos del préstamo", loan_amounts:"Importe", loan_installments:"Cuotas", loan_payment:"Pago mensual", loan_day:"Calendario", loan_start:"Inicio", set_backup:"💾 Copia de seguridad", set_backup_desc:"Tus datos viven solo en este navegador. Exporta una copia para no perderlos o para moverlos a otro dispositivo.",
export_data:"⬇️ Exportar datos (JSON)", import_tap:"⬆️ Toca para importar una copia", import_note:"(reemplaza los datos actuales)",
danger:"🗑️ Zona de peligro", danger_desc:"Esta acción no se puede deshacer.", delete_all:"🗑️ Borrar todos los datos",
about:"ℹ️ Acerca de", about_1:"App 100% local: ningún dato sale de tu dispositivo.", about_2:"Los cobros programados se descuentan automáticamente al abrir la app cuando llega su fecha y hora.", about_3:"Versión 2.7 · Divisas optimizadas · Septiembre 2026",
set_lang:"🌐 Idioma", set_lang_desc:"Elige el idioma de toda la app.", set_money:"💱 Moneda", set_money_desc:"Elige la moneda de toda la app (préstamos, cobros, metas y movimientos).", save:"Guardar", add_money:"💰 Añadir dinero", withdraw_money:"− Retirar dinero", confirm_pay_n:"¿Confirmar pago de {n} cuota(s) ({d}–{a}/{t})? Total: {tot}", inst_label_n:"Cuotas {d}–{a}/{t} — {name}", to_money:"💱 Moneda actualizada",
close:"Cerrar ✕", fab_tx:"💸 Nuevo movimiento", fab_bill:"💳 Nuevo cobro programado", fab_loan:"🏦 Nuevo préstamo", fab_goal:"🎯 Nueva meta",
to_tx_upd:"✏️ Movimiento actualizado", to_tx_saved:"✅ Movimiento guardado", to_tx_del:"🗑️ Movimiento eliminado",
to_bill_upd:"✏️ Cobro actualizado", to_bill_sched:"⏰ Cobro programado", to_bill_resumed:"▶ Cobro activado", to_bill_paused:"⏸ Cobro pausado", to_bill_del:"🗑️ Cobro eliminado",
to_goal_upd:"✏️ Meta actualizada", to_goal_created:"🎯 Meta creada", to_goal_completed:"🏆 ¡Meta completada!", to_add_saved:"💰 Aporte registrado", to_wd_saved:"💸 Retiro registrado", to_goal_del:"🗑️ Meta eliminada",
to_loan_upd:"✏️ Préstamo actualizado", to_loan_reg:"🏦 Préstamo registrado", to_loan_del:"🗑️ Préstamo eliminado", to_loan_paid_full:"🎉 ¡Préstamo ya pagado por completo!", to_inst_paid:"✔ Cuota pagada",
to_exported:"⬇️ Copia exportada", to_imported:"✅ Datos importados", to_lang:"✅ Idioma actualizado",
conf_del_tx:"¿Eliminar este movimiento?", conf_del_bill:"¿Eliminar este cobro programado?", conf_del_goal:"¿Eliminar esta meta?", conf_del_loan:"¿Eliminar este préstamo y su historial de cuotas?",
conf_import:"Esto REEMPLAZARÁ todos los datos actuales. ¿Continuar?", invalid_file:"⚠️ Archivo no válido", conf_del_all_1:"¿Seguro? Se borrarán TODOS los datos.", conf_del_all_2:"Última confirmación: esta acción no se puede deshacer.",
prompt_add:'Aportar a "{name}". ¿Cuánto añades? (€)', prompt_withdraw:'Retirar de "{name}". ¿Cuánto quitas? (€)',
aviso1:"✅ Se descontaron ", aviso2:" cobro(s) por ", cat_bill:"Cobro programado", recurring:" (recurrente)", cat_loan:"Préstamo",
inst_label:"Cuota {n}/{t} — {name}", confirm_pay:"¿Confirmar pago de la cuota {n}/{t} de {a}?",
you_have_left:"Te quedan ", k_insts:"cuotas", k_inst:"cuota", k_day:"día ", k_month:"mes", k_completed:"completado", k_target:"objetivo",
paid:"✔ Pagada", overdue:"⚠ Pendiente", pending:"Pendiente", inst_no:"Cuota", due_date:"Fecha prevista", d_status2:"Estado",
total_borrowed:"Total prestado", paid_so_far:"Ya pagado", movs_registered:"movimientos registrados", bills_pending:"cobro(s) pendiente(s)",
net_saving:"Ahorro neto:", deficit:"Déficit:", pay_inst:"✔ Pagar cuota", installments_btn:"📋 Cuotas", paid_off:"✅ Liquidado",
no_goals_first:"Crea tu primera meta de ahorro 💪", no_loans_empty:"Registra tus préstamos para seguir sus cuotas",
completed:"🏆 ¡Completada!", by_prefix:" · antes del ", tap_options:" · toca para ver opciones", k_left:"restantes", k_saved_short:"ahorrado", k_days_left:"días restantes", k_due_today:"vence hoy", k_save_monthly:"Ahorro recomendado", pres_near:"Cerca del límite", pres_ok:"En presupuesto", pres_month:"Este mes", pres_left:"Disponible", pres_over_by:"Exceso de",
pres_title:"💸 Presupuestos de gasto", pres_new:"Nuevo presupuesto", pres_edit:"Editar presupuesto", pres_update:"Actualizar presupuesto", pres_mine:"Mis presupuestos (este mes)", lbl_limit:"Límite mensual (€)", pres_create:"Crear presupuesto", pres_over:"¡Presupuesto superado!", no_pres:"No tienes presupuestos creados", to_pres_saved:"✅ Presupuesto guardado", to_pres_del:"🗑️ Presupuesto eliminado", conf_del_budget:"¿Eliminar este presupuesto?", k_of:"de", commission:"Comisión por amortización anticipada", remaining_balance:"Saldo restante", payoff_total:"Amortización Completo", commission_rule:"más de 12 meses restantes: 1% · 12 meses o menos: 0,5%", d_principal:"Capital pendiente", d_saved_interest:"Interés que te ahorras", d_penalty:"Penalización anticipada", due_now:"¡vence ahora!", fab_budget:"💸 Nuevo presupuesto",
d_no:"No.", d_due:"Due date", d_amount:"Amount", d_status_en:"Status", fx_title:"💱 Exchange rates", fx_refresh:"↻ Refresh", fx_desc:"Reference exchange rates, updated from a public source.", fx_updated:"Updated"
},
en: {
brand:"My Finances", nav_panel:"📊 Dashboard", nav_movs:"💸 Transactions", nav_cobros:"💳 Bills & loans", nav_metas:"🎯 Goals", nav_ajustes:"⚙️ Settings",
nav_panel_s:"Home", nav_movs_s:"Regis", nav_pagos_s:"Bills", nav_metas_s:"Goals", nav_fx_s:"FX", nav_fx:"💱 Exchange rates",
kpi_balance:"💼 Total balance", kpi_income:"📈 Income this month", kpi_expense:"📉 Expenses this month", kpi_due:"⏰ Upcoming payments", kpi_after_due:"💰 Balance after upcoming", kpi_after_due_sub:"After all upcoming payments",
ch_6m:"Last 6 months", ch_by_cat:"Spending by category (this month)", leg_income:"Income", leg_expense:"Expenses",
p_recent:"🕐 Recent transactions", p_bills:"⏰ Scheduled bills", p_goals:"🎯 Goals", p_loans:"🏦 Loans", p_topcat:"🏆 Top spending categories (this month)",
no_tx_yet:"No transactions yet", no_bills:"No scheduled bills", no_goals:"No goals yet", no_loans:"No loans yet", no_exp_month:"No expenses this month",
v_movs_title:"💸 Income & expenses", btn_new_tx:"＋ New transaction", hist_filters:"History & filters", ph_search:"🔍 Search…", opt_all:"All", opt_income:"Income", opt_expense:"Expenses", all_months:"All months",
th_cat:"Category", th_date:"Date", th_amount:"Amount", no_results:"No results", k_results:"result(s)", k_net:"Net:", show_more:"▼ Show more (", remaining:" remaining)", show_less:"▲ Show less",
frm_new_tx:"New transaction", frm_edit_tx:"Edit transaction", editing_tx:"✏️ Editing transaction", cancel_edit:"cancel editing",
lbl_type:"Type", lbl_amount:"Amount", lbl_category:"Category", lbl_description:"Description", lbl_date:"Date",
opt_inc_s:"📈 Income", opt_exp_s:"📉 Expense", save_tx:"Save transaction", update_tx:"Update transaction", ph_cats:"e.g. Food, Salary, Transport…", ph_detail:"Details (optional)",
v_cobros_title:"💳 Bills & loans", btn_new_bill:"＋ New bill", scheduled_bills:"Scheduled bills", th_concept:"Bill", th_next:"Next",
frm_new_bill:"New scheduled bill", frm_edit_bill:"Edit bill", editing_bill:"✏️ Editing bill", cancel:"cancel",
lbl_concept:"Bill", lbl_start:"Start date", lbl_time:"Time", lbl_repeats:"Repeats", f_unico:"One-time", f_mensual:"Monthly", f_semanal:"Weekly", f_anual:"Yearly",
schedule_bill:"Schedule bill", update_bill:"Update bill", ph_bill:"e.g. Netflix, Rent, Electricity…",
loans_title:"🏦 Loans & installments", btn_new_loan:"＋ New loan", my_loans:"My loans",
frm_new_loan:"New loan", frm_edit_loan:"Edit loan", editing_loan:"✏️ Editing loan",
lbl_name:"Name / lender", lbl_total:"Total amount (€)", lbl_ninst:"No. of installments", lbl_per_inst:"Amount per installment (€)", lbl_payday:"Monthly payment day", lbl_first_date:"First installment date",
ph_loan:"e.g. Car loan — BBVA", ph_day5:"e.g. 5", register_loan:"Register loan", update_loan:"Update loan",
metas_title:"🎯 Savings goals", btn_new_goal:"＋ New goal", my_goals:"My goals",
frm_new_goal:"New goal", frm_edit_goal:"Edit goal", editing_goal:"✏️ Editing goal",
lbl_goal_name:"Goal name", lbl_target:"Target amount (€)", lbl_target_date:"Target date (optional)", ph_goal:"e.g. Trip to Japan", create_goal:"Create goal", update_goal:"Update goal",
det_tx:"💸 Transaction details", d_description:"Description", det_bill:"💳 Bill details", det_goal:"🎯 Goal details",
d_type:"Type", d_repeats:"Repeats", d_next:"Next date", d_status:"Status", d_goal:"Goal", d_saved:"Saved", d_target2:"Target", d_progress:"Progress", d_missing:"Remaining", d_target_date:"Target date",
no_description:"No description", active:"● Active", paused:"⏸ Paused", edit:"✏️ Edit", delete:"🗑️ Delete", pause:"⏸ Pause", resume:"▶ Resume", add:"＋ Add", withdraw:"− Withdraw",
t_ingreso:"income", t_gasto:"expense",
set_title:"⚙️ Settings & data", set_profile:"👤 Profile", set_profile_photo:"Profile photo", set_profile_desc:"Upload a photo to show in the header. It is stored only on this device.", profile_upload:"Upload photo", profile_remove:"Remove", set_theme:"🎨 Theme", set_theme_desc:"Choose dark or light theme.", loan_basic:"Loan details", loan_amounts:"Amount", loan_installments:"Installments", loan_payment:"Monthly payment", loan_day:"Calendar", loan_start:"Start", set_backup:"💾 Backup", set_backup_desc:"Your data lives only in this browser. Export a copy to avoid losing it or to move it to another device.",
export_data:"⬇️ Export data (JSON)", import_tap:"⬆️ Tap to import a backup", import_note:"(replaces current data)",
danger:"🗑️ Danger zone", danger_desc:"This action cannot be undone.", delete_all:"🗑️ Delete all data",
about:"ℹ️ About", about_1:"100% local app: no data leaves your device.", about_2:"Scheduled bills are deducted automatically when you open the app at their date and time.", about_3:"Version 2.7 · Optimized currencies · September 2026",
set_lang:"🌐 Language", set_lang_desc:"Choose the app language.", set_money:"💱 Currency", set_money_desc:"Choose the currency for the whole app (loans, bills, goals and transactions).", save:"Save", add_money:"💰 Add money", withdraw_money:"− Withdraw money", confirm_pay_n:"Confirm payment of {n} installment(s) ({d}–{a}/{t})? Total: {tot}", inst_label_n:"Installments {d}–{a}/{t} — {name}", to_money:"💱 Currency updated",
close:"Close ✕", fab_tx:"💸 New transaction", fab_bill:"💳 New scheduled bill", fab_loan:"🏦 New loan", fab_goal:"🎯 New goal",
to_tx_upd:"✏️ Transaction updated", to_tx_saved:"✅ Transaction saved", to_tx_del:"🗑️ Transaction deleted",
to_bill_upd:"✏️ Bill updated", to_bill_sched:"⏰ Bill scheduled", to_bill_resumed:"▶ Bill resumed", to_bill_paused:"⏸ Bill paused", to_bill_del:"🗑️ Bill deleted",
to_goal_upd:"✏️ Goal updated", to_goal_created:"🎯 Goal created", to_goal_completed:"🏆 Goal completed!", to_add_saved:"💰 Contribution saved", to_wd_saved:"💸 Withdrawal saved", to_goal_del:"🗑️ Goal deleted",
to_loan_upd:"✏️ Loan updated", to_loan_reg:"🏦 Loan registered", to_loan_del:"🗑️ Loan deleted", to_loan_paid_full:"🎉 Loan already fully paid!", to_inst_paid:"✔ Installment paid",
to_exported:"⬇️ Backup exported", to_imported:"✅ Data imported", to_lang:"✅ Language updated",
conf_del_tx:"Delete this transaction?", conf_del_bill:"Delete this scheduled bill?", conf_del_goal:"Delete this goal?", conf_del_loan:"Delete this loan and its installment history?",
conf_import:"This will REPLACE all current data. Continue?", invalid_file:"⚠️ Invalid file", conf_del_all_1:"Are you sure? ALL data will be deleted.", conf_del_all_2:"Final confirmation: this cannot be undone.",
prompt_add:'Add to "{name}". How much are you adding? (€)', prompt_withdraw:'Withdraw from "{name}". How much? (€)',
aviso1:"✅ Deducted ", aviso2:" bill(s) totaling ", cat_bill:"Scheduled bill", recurring:" (recurring)", cat_loan:"Loan",
inst_label:"Installment {n}/{t} — {name}", confirm_pay:"Confirm payment of installment {n}/{t} of {a}?",
you_have_left:"Remaining ", k_insts:"installments", k_inst:"inst", k_day:"day ", k_month:"month", k_completed:"completed", k_target:"target",
paid:"✔ Paid", overdue:"⚠ Overdue", pending:"Pending", inst_no:"No.", due_date:"Due date", d_status2:"Status",
total_borrowed:"Total borrowed", paid_so_far:"Paid so far", movs_registered:"transactions recorded", bills_pending:"pending bill(s)",
net_saving:"Net saving:", deficit:"Deficit:", pay_inst:"✔ Pay installment", installments_btn:"📋 Installments", paid_off:"✅ Paid off",
no_goals_first:"Create your first savings goal 💪", no_loans_empty:"Add your loans to track installments",
completed:"🏆 Completed!", by_prefix:" · by ", tap_options:" · tap to see options", k_left:"remaining", k_saved_short:"saved", k_days_left:"days left", k_due_today:"due today", k_save_monthly:"Recommended saving", pres_near:"Near limit", pres_ok:"On budget", pres_month:"This month", pres_left:"Available", pres_over_by:"Over by",
pres_title:"💸 Spending budgets", pres_new:"New budget", pres_edit:"Edit budget", pres_update:"Update budget", pres_mine:"My budgets (this month)", lbl_limit:"Monthly limit (€)", pres_create:"Create budget", pres_over:"Budget exceeded!", no_pres:"No budgets yet", to_pres_saved:"✅ Budget saved", to_pres_del:"🗑️ Budget deleted", conf_del_budget:"Delete this budget?", k_of:"of", commission:"Early repayment fee", remaining_balance:"Remaining balance", payoff_total:"Full amortization", commission_rule:"more than 12 months left: 1% · 12 months or less: 0.5%", d_principal:"Remaining principal", d_saved_interest:"Interest you save", d_penalty:"Early repayment fee", due_now:"due now!", fab_budget:"💸 New budget",
d_no:"No.", d_due:"Due date", d_amount:"Amount", d_status_en:"Status", fx_title:"💱 Exchange rates", fx_refresh:"↻ Refresh", fx_desc:"Reference exchange rates, updated from a public source.", fx_updated:"Updated"
}
};
let LANG = db.lang || 'es';
function t(k){ const v = I18N[LANG]; return (v && v[k] !== undefined) ? v[k] : (I18N.es[k] !== undefined ? I18N.es[k] : k); }
const LOCALE = () => LANG==='en' ? 'en-US' : 'es-ES';
function aplicarIdioma(){
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const cur = (db && db.moneda) ? db.moneda : 'EUR';
  document.querySelectorAll('[data-i18n="lbl_amount"]').forEach(el => { el.textContent = t('lbl_amount') + ' (' + cur + ')'; });
}
function guardar(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(db)); return true; }catch(_){ toast(LANG==='en'?'⚠️ Could not save data on this device.':'⚠️ No se pudieron guardar los datos en este dispositivo.'); return false; } }

function abrirModal(id){
  const modal=$(id); if(!modal) return;
  if(!document.querySelector('.modal-backdrop.open')){
    const y=window.scrollY||window.pageYOffset||0;
    document.body.dataset.modalScrollY=String(y);
    document.body.style.position='fixed';
    document.body.style.top=`-${y}px`;
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.width='100%';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }
  modal.classList.add('open');
  const fw=$('fabWrap'); if(fw) fw.style.display='none';
}
function cerrarModal(id){
  const modal=$(id); if(!modal) return;
  modal.classList.remove('open');
  if(!document.querySelector('.modal-backdrop.open')){
    const y=parseInt(document.body.dataset.modalScrollY||'0',10)||0;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.body.style.position='';
    document.body.style.top='';
    document.body.style.left='';
    document.body.style.right='';
    document.body.style.width='';
    delete document.body.dataset.modalScrollY;
    // Restaurar una sola vez para evitar el salto arriba/abajo en iOS.
    const prevBehavior=document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0,y);
    document.documentElement.style.scrollBehavior=prevBehavior;
    renderFab(vistaActiva());
  }
}
// Ventana de detalle con botones (igual en movs, pagos y metas)
function abrirDetalle(titulo, cuerpo, acciones){
  $('detalleTituloGenerico').textContent = titulo;
  $('detalleCuerpo').innerHTML = cuerpo;
  $('detalleAcciones').innerHTML = acciones;
  abrirModal('modalDetalle');
}
function verDetalleMov(id){
  const m = db.movimientos.find(x=>x.id===id); if(!m) return;
  abrirDetalle(t('det_tx'),
    `<div class="stat-line"><span>${t('d_type')}</span><b><span class="tag tag-${m.tipo}">${t('t_'+m.tipo)}</span>${m.auto?' <span class="tag tag-auto">auto</span>':''}</b></div>
     <div class="stat-line"><span>${t('th_cat')}</span><b>${esc(m.categoria)}</b></div>
     <div class="stat-line"><span>${t('th_amount')}</span><b class="${m.tipo==='ingreso'?'green':'red'}">${m.tipo==='ingreso'?'+':'−'}${fmt(m.monto)}</b></div>
     <div class="stat-line"><span>${t('th_date')}</span><b>${fmtFecha(m.fecha)}</b></div>
     <div class="stat-line"><span>${t('d_description')}</span><b>${m.descripcion?esc(m.descripcion):'<i style="color:var(--muted)">'+t('no_description')+'</i>'}</b></div>`,
    `<button class="btn btn-green btn-sm" onclick="cerrarModal('modalDetalle');editarMov('${m.id}')">${t('edit')}</button>
     <button class="btn btn-danger btn-sm" onclick="cerrarModal('modalDetalle');borrarMov('${m.id}')">${t('delete')}</button>`);
}
function verDetalleCobro(id){
  const c = db.cobros.find(x=>x.id===id); if(!c) return;
  const freqTxt = {unico:t('f_unico'), mensual:t('f_mensual'), semanal:t('f_semanal'), anual:t('f_anual')};
  abrirDetalle(t('det_bill'),
    `<div class="stat-line"><span>${t('lbl_concept')}</span><b>${esc(c.concepto)}</b></div>
     <div class="stat-line"><span>${t('th_amount')}</span><b class="red">−${fmt(c.monto)}</b></div>
     <div class="stat-line"><span>${t('d_repeats')}</span><b>${freqTxt[c.frecuencia]}</b></div>
     <div class="stat-line"><span>${t('d_next')}</span><b>${fmtFecha(c.proxima)} · ${c.hora}</b></div>
     <div class="stat-line"><span>${t('d_status')}</span><b>${c.activo?t('active'):t('paused')}</b></div>`,
    `<button class="btn btn-green btn-sm" onclick="cerrarModal('modalDetalle');editarCobro('${c.id}')">${t('edit')}</button>
     <button class="btn btn-ghost btn-sm" onclick="cerrarModal('modalDetalle');toggleCobro('${c.id}')">${c.activo?t('pause'):t('resume')}</button>
     <button class="btn btn-danger btn-sm" onclick="cerrarModal('modalDetalle');borrarCobro('${c.id}')">${t('delete')}</button>`);
}
function verDetalleMeta(id){
  const g = db.metas.find(x=>x.id===id); if(!g) return;
  const pct = Math.min(100, Math.round(g.ahorrado/g.objetivo*100));
  abrirDetalle(t('det_goal'),
    `<div class="stat-line"><span>${t('d_goal')}</span><b>${esc(g.nombre)}</b></div>
     <div class="stat-line"><span>${t('d_saved')}</span><b class="green">${fmt(g.ahorrado)}</b></div>
     <div class="stat-line"><span>${t('d_target2')}</span><b>${fmt(g.objetivo)}</b></div>
     <div class="stat-line"><span>${t('d_progress')}</span><b>${pct}%</b></div>
     <div class="stat-line"><span>${t('d_missing')}</span><b class="yellow">${fmt(Math.max(0, g.objetivo-g.ahorrado))}</b></div>
     ${g.fechaObjetivo?`<div class="stat-line"><span>${t('d_target_date')}</span><b>${fmtFecha(g.fechaObjetivo)}</b></div>`:''}
     <div class="progress" style="margin-top:12px;"><div style="width:${pct}%;background:${pct>=100?'var(--green)':'var(--accent)'};"></div></div>`,
    `<button class="btn btn-green btn-sm" onclick="cerrarModal('modalDetalle');aportarMeta('${g.id}')">${t('add')}</button>
     <button class="btn btn-ghost btn-sm" onclick="cerrarModal('modalDetalle');retirarMeta('${g.id}')">${t('withdraw')}</button>
     <button class="btn btn-ghost btn-sm" onclick="cerrarModal('modalDetalle');editarMeta('${g.id}')">${t('edit')}</button>
     <button class="btn btn-danger btn-sm" onclick="cerrarModal('modalDetalle');borrarMeta('${g.id}')">${t('delete')}</button>`);
}
// Confirmación propia (web), no la del navegador
let _confirmResolver = null;
function confirmarWeb(msg, opts={}){
  return new Promise(res=>{
    _confirmResolver = res;
    $('confirmMsg').textContent = msg;
    $('confirmOk').textContent = opts.ok || '✔';
    $('confirmOk').className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-green');
    abrirModal('modalConfirm');
  });
}
function resolverConfirm(v){ if(_confirmResolver){ const r=_confirmResolver; _confirmResolver=null; cerrarModal('modalConfirm'); r(v); } }
document.addEventListener('click', e => {
  if(e.target.classList && e.target.classList.contains('modal-backdrop')){
    if(e.target.id === 'modalConfirm') resolverConfirm(false);
    else cerrarModal(e.target.id);
  }
});

$('confirmOk') && 0;document.getElementById('confirmOk').addEventListener('click', ()=>resolverConfirm(true));
document.getElementById('confirmCancel').addEventListener('click', ()=>resolverConfirm(false));
let toastTimer;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2600); }

// Efecto ripple en botones
document.addEventListener('pointerdown', e=>{
  const b = e.target.closest('.btn,.fab,.icon-btn,.fab-item'); if(!b) return;
  const rect = b.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height);
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-rect.left-d/2}px;top:${e.clientY-rect.top-d/2}px`;
  b.appendChild(s);
  setTimeout(()=>s.remove(), 600);
});

// ================= TEMA =================
function aplicarTema(){
  document.documentElement.dataset.theme = db.theme||'dark';
  const b=$('btnTemaAjustes');
  if(b) b.textContent = db.theme==='dark' ? '☀️ Cambiar a tema claro' : '🌙 Cambiar a tema oscuro';
}
function cambiarTema(){ db.theme = (db.theme==='dark')?'light':'dark'; guardar(); aplicarTema(); renderCharts(); }
function renderPerfil(){
  const src=db.profilePhoto||'';
  const avatar=$('headerProfileAvatar'), preview=$('profilePreview');
  if(avatar) avatar.innerHTML=src ? `<img src="${src}" alt="Perfil">` : '👤';
  if(preview) preview.innerHTML=src ? `<img src="${src}" alt="Perfil">` : '👤';
}
function cambiarFotoPerfil(ev){
  const file=ev.target.files && ev.target.files[0]; if(!file) return;
  if(!file.type.startsWith('image/')) return;
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const max=500, scale=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      db.profilePhoto=c.toDataURL('image/jpeg',.82); guardar(); renderPerfil(); toast('✅ Foto de perfil actualizada');
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file); ev.target.value='';
}
function quitarFotoPerfil(){ db.profilePhoto=''; guardar(); renderPerfil(); toast('👤 Foto de perfil eliminada'); }
$('selLang').addEventListener('change', e => {
  db.lang = e.target.value; LANG = db.lang; guardar();
  aplicarIdioma(); renderFab(vistaActiva()); renderTodo();
  toast(t('to_lang'));
});
$('selMoneda').addEventListener('change', e => {
  db.moneda = e.target.value; guardar();
  aplicarIdioma(); renderTodo();
  toast(t('to_money'));
});

// ================= FAB: NUEVOS REGISTROS =================
function nuevoMov(){ cancelarEdicionMov(); $('mFecha').value=hoyISO(); abrirModal('modalMov'); }
function nuevoCobro(){ cancelarEdicionCobro(); $('cFecha').value=hoyISO(); abrirModal('modalCobro'); }
function nuevoPrestamo(){ cancelarEdicionPrestamo(); abrirModal('modalPrestamo'); }
function nuevoMeta(){ cancelarEdicionMeta(); abrirModal('modalMeta'); }
function nuevoPres(){
  $('prLimite').value='';
  renderPresupuestos();
  const sel=$('prCategoria');
  if(sel && !sel.value && sel.options.length) sel.selectedIndex=0;
  abrirModal('modalPres');
}
const FAB_ITEMS = {
  panel:[{k:'fab_tx', fn:()=>nuevoMov()}],
  movimientos:[{k:'fab_tx', fn:()=>nuevoMov()},{k:'fab_goal', fn:()=>nuevoMeta()},{k:'fab_budget', fn:()=>nuevoPres()}],
  cobros:[{k:'fab_bill', fn:()=>nuevoCobro()},
          {k:'fab_loan', fn:()=>nuevoPrestamo()}],
  metas:[{k:'fab_goal', fn:()=>nuevoMeta()},
         {k:'fab_budget', fn:()=>nuevoPres()}],
  ajustes:[],
  divisas:[]
};
function vistaActiva(){ const v = document.querySelector('.view.active'); return v ? v.id.replace('view-','') : 'panel'; }
function renderFab(view){
  view = view || vistaActiva();
  const items = FAB_ITEMS[view] || [];
  $('fabWrap').style.display = items.length ? 'flex' : 'none';
  $('fabMenu').innerHTML = items.map((it,i)=>`<button type="button" class="fab-item" data-i="${i}">${t(it.k)}</button>`).join('');
  $('fabMenu').classList.remove('show');
  $('fabBtn').classList.remove('open');
}
$('fabBtn').addEventListener('click', ()=>{
  const items = FAB_ITEMS[vistaActiva()] || [];
  if(items.length === 1){ items[0].fn(); return; } // acción directa, sin menú
  if(!items.length) return;
  $('fabMenu').classList.toggle('show');
  $('fabBtn').classList.toggle('open');
});
$('fabMenu').addEventListener('click', e=>{
  const btn = e.target.closest('.fab-item'); if(!btn) return;
  const items = FAB_ITEMS[vistaActiva()] || [];
  const it = items[+btn.dataset.i]; if(!it) return;
  it.fn();
  $('fabMenu').classList.remove('show');
  $('fabBtn').classList.remove('open');
});
document.addEventListener('click', e=>{
  if(!e.target.closest('.fab-wrap')){ $('fabMenu').classList.remove('show'); $('fabBtn').classList.remove('open'); }
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){ $('fabMenu').classList.remove('show'); $('fabBtn').classList.remove('open'); }
});

// ================= NAVEGACIÓN =================
function switchView(v){
  const target=document.getElementById('view-'+v);
  if(!target){
    const pages={panel:'panel.html',movimientos:'regis.html',cobros:'pagos.html',divisas:'divisas.html',ajustes:'Ajustes.html'};
    if(pages[v]) location.href=pages[v];
    return;
  }
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active', x.dataset.view===v));
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  target.classList.add('active');
  history.replaceState(null,'','#'+v);
  if(v==='panel') setTimeout(renderCharts,60);
  if(v==='divisas') actualizarDivisas();
  renderFab(v);
  window.scrollTo({top:0});
}
document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));

// ================= COBROS: DESCUENTO AUTOMÁTICO =================
function siguienteFechaRecurrente(iso, frecuencia){
  if(!iso || !['mensual','semanal','anual'].includes(frecuencia)) return null;
  const base=new Date(iso+'T12:00:00');
  if(Number.isNaN(base.getTime())) return null;
  const dia=base.getDate();
  if(frecuencia==='semanal'){
    base.setDate(base.getDate()+7);
  }else if(frecuencia==='mensual'){
    const y=base.getFullYear(), m=base.getMonth()+1;
    const ultimo=new Date(y,m+1,0).getDate();
    base.setFullYear(y,m,Math.min(dia,ultimo));
  }else{
    const y=base.getFullYear()+1, m=base.getMonth(), ultimo=new Date(y,m+1,0).getDate();
    base.setFullYear(y,m,Math.min(dia,ultimo));
  }
  return base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-'+String(base.getDate()).padStart(2,'0');
}

function aplicarCobrosVencidos(){
  const ahora = new Date(); const aplicados = [];
  db.cobros.forEach(c => {
    if(!c.activo) return;
    if(c.frecuencia!=='unico' && !['mensual','semanal','anual'].includes(c.frecuencia)) return;
    let fh = new Date(c.proxima + 'T' + (c.hora||'09:00'));
    while(fh <= ahora){
      db.movimientos.push({ id:uid(), tipo:'gasto', monto:c.monto, categoria:t('cat_bill'), descripcion:c.concepto + (c.frecuencia!=='unico' ? t('recurring') : ''), fecha: c.proxima, auto:true });
      aplicados.push(c);
      if(c.frecuencia === 'unico'){ c.activo = false; break; }
      c.proxima = siguienteFechaRecurrente(c.proxima,c.frecuencia);
      if(!c.proxima) { c.activo=false; break; }
      fh = new Date(c.proxima + 'T' + (c.hora||'09:00'));
    }
  });
  if(aplicados.length){
    guardar();
    const total = aplicados.reduce((s,c)=>s+c.monto,0);
    $('avisos').innerHTML = `<div class="aviso">${t('aviso1')}<b>${aplicados.length}</b>${t('aviso2')}<b>${fmt(total)}</b>: ${aplicados.map(c=>esc(c.concepto)).join(', ')}.</div>`;
    setTimeout(()=>{ $('avisos').innerHTML=''; }, 12000);
  }
}

// ================= CUENTA ATRÁS DE COBROS (PANEL) =================
function countdownParts(diff){
  if(diff<=0) return null;
  const s = Math.floor(diff/1000);
  return {
    d: Math.floor(s/86400),
    h: Math.floor(s%86400/3600),
    m: Math.floor(s%3600/60),
    sec: s%60
  };
}

function countdownHTML(diff){
  if(diff<=0){
    return `<div class="countdown-calendar is-due"><span class="countdown-due">⚠ ${esc(t('due_now'))}</span></div>`;
  }
  const parts = countdownParts(diff);
  const p = n => String(n).padStart(2,'0');
  const unit = (value, label) => `
    <div class="countdown-unit">
      <div class="countdown-card">
        <span class="countdown-number">${p(value)}</span>
      </div>
      <span class="countdown-label">${label}</span>
    </div>`;
  return `<div class="countdown-calendar">
    ${unit(parts.d,'D')}
    <span class="countdown-sep">:</span>
    ${unit(parts.h,'H')}
    <span class="countdown-sep">:</span>
    ${unit(parts.m,'M')}
    <span class="countdown-sep">:</span>
    ${unit(parts.sec,'S')}
  </div>`;
}

function updateCountdowns(){
  const ahora = new Date();
  document.querySelectorAll('[data-cd]').forEach(el=>{
    const c = db.cobros.find(x=>x.id===el.dataset.cd);
    if(!c){ el.textContent = '—'; return; }
    const diff = new Date(c.proxima+'T'+(c.hora||'09:00')) - ahora;
    el.innerHTML = countdownHTML(diff);
  });
  document.querySelectorAll('[data-cdp]').forEach(el=>{
    const p = db.prestamos.find(x=>x.id===el.dataset.cdp);
    if(!p){ el.textContent = '—'; return; }
    const info = proximaCuotaInfo(p);
    if(!info){ el.textContent = '—'; return; }
    const diff = new Date(info.fecha+'T23:59:59') - ahora;
    el.innerHTML = countdownHTML(diff);
  });
}

setInterval(updateCountdowns, 1000);

// ================= MOVIMIENTOS =================
$('formMov').addEventListener('submit', e => {
  e.preventDefault();
  if(window.__savingMov) return; window.__savingMov = true;
  const id = $('mId').value;
  const data = { tipo:$('mTipo').value, monto:parseFloat($('mMonto').value), categoria:$('mCategoria').value.trim()||'General', descripcion:$('mDesc').value.trim(), fecha:$('mFecha').value };
  if(id){
    const m = db.movimientos.find(x=>x.id===id); Object.assign(m, data); toast(t('to_tx_upd'));
  } else {
    db.movimientos.push({ id:uid(), ...data }); toast(t('to_tx_saved'));
  }
  guardar(); cancelarEdicionMov(); cerrarModal('modalMov'); $('mFecha').value = hoyISO(); $('mMonto').value=''; $('mDesc').value=''; renderTodo(); window.__savingMov=false;
});
function editarMov(id){
  const m = db.movimientos.find(x=>x.id===id); if(!m) return;
  $('mId').value=m.id; $('mTipo').value=m.tipo; poblarCategorias(m.categoria); $('mMonto').value=m.monto; $('mCategoria').value=m.categoria; $('mDesc').value=m.descripcion||''; $('mFecha').value=m.fecha;
  $('tituloFormMov').textContent=t('frm_edit_tx'); $('btnSubmitMov').textContent=t('update_tx');
  $('editNoteMov').style.display='block'; abrirModal('modalMov');
}
function cancelarEdicionMov(){
  $('mId').value=''; $('mMonto').value=''; $('mDesc').value=''; $('mFecha').value=hoyISO(); $('tituloFormMov').textContent=t('frm_new_tx'); $('btnSubmitMov').textContent=t('save_tx'); $('editNoteMov').style.display='none'; cerrarModal('modalMov');
}
function borrarMov(id){
  confirmarWeb(t('conf_del_tx'),{danger:true}).then(ok=>{
    if(!ok) return;
    db.movimientos = db.movimientos.filter(m=>m.id!==id); guardar(); renderTodo(); toast(t('to_tx_del'));
  });
}
['fBuscar','fTipo','fMes'].forEach(id => $(id).addEventListener('input', ()=>{ movLimit = 10; renderMovimientos(); }));

// ================= COBROS =================
$('formCobro').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('cId').value;
  const data = { concepto:$('cConcepto').value.trim(), monto:parseFloat($('cMonto').value), proxima:$('cFecha').value, hora:$('cHora').value, frecuencia:$('cFrec').value };
  if(id){
    const c = db.cobros.find(x=>x.id===id); Object.assign(c, data); toast(t('to_bill_upd'));
  } else {
    db.cobros.push({ id:uid(), ...data, activo:true }); toast(t('to_bill_sched'));
  }
  guardar(); cancelarEdicionCobro(); cerrarModal('modalCobro'); $('cMonto').value=''; renderTodo();
});
function editarCobro(id){
  const c = db.cobros.find(x=>x.id===id); if(!c) return;
  $('cId').value=c.id; $('cConcepto').value=c.concepto; $('cMonto').value=c.monto; $('cFecha').value=c.proxima; $('cHora').value=c.hora; $('cFrec').value=c.frecuencia;
  $('tituloFormCobro').textContent=t('frm_edit_bill'); $('btnSubmitCobro').textContent=t('update_bill'); $('editNoteCobro').style.display='block'; abrirModal('modalCobro');
}
function cancelarEdicionCobro(){ $('cId').value=''; $('cConcepto').value=''; $('cMonto').value=''; $('cFecha').value=hoyISO(); $('tituloFormCobro').textContent=t('frm_new_bill'); $('btnSubmitCobro').textContent=t('schedule_bill'); $('editNoteCobro').style.display='none'; cerrarModal('modalCobro'); }
function toggleCobro(id){ const c = db.cobros.find(x=>x.id===id); c.activo=!c.activo; guardar(); renderTodo(); toast(c.activo?t('to_bill_resumed'):t('to_bill_paused')); }
function borrarCobro(id){
  confirmarWeb(t('conf_del_bill'),{danger:true}).then(ok=>{
    if(!ok) return;
    db.cobros = db.cobros.filter(c=>c.id!==id); guardar(); renderTodo(); toast(t('to_bill_del'));
  });
}

// ================= METAS =================
$('formMeta').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('gId').value;
  const data = { nombre:$('gNombre').value.trim(), objetivo:parseFloat($('gObjetivo').value), fechaObjetivo:$('gFecha').value||null };
  if(id){
    const g = db.metas.find(x=>x.id===id); Object.assign(g, data); toast(t('to_goal_upd'));
  } else {
    db.metas.push({ id:uid(), ...data, ahorrado:0 }); toast(t('to_goal_created'));
  }
  guardar(); cancelarEdicionMeta(); cerrarModal('modalMeta'); renderTodo();
});
function editarMeta(id){
  const g = db.metas.find(x=>x.id===id); if(!g) return;
  $('gId').value=g.id; $('gNombre').value=g.nombre; $('gObjetivo').value=g.objetivo; $('gFecha').value=g.fechaObjetivo||'';
  $('tituloFormMeta').textContent=t('frm_edit_goal'); $('btnSubmitMeta').textContent=t('update_goal'); $('editNoteMeta').style.display='block'; abrirModal('modalMeta');
}
function cancelarEdicionMeta(){ $('gId').value=''; $('gNombre').value=''; $('gObjetivo').value=''; $('gFecha').value=''; $('tituloFormMeta').textContent=t('frm_new_goal'); $('btnSubmitMeta').textContent=t('create_goal'); $('editNoteMeta').style.display='none'; cerrarModal('modalMeta'); }
function abrirMetaMonto(id, modo){
  const meta=db.metas.find(m=>m.id===id); if(!meta) return;
  $('metaMontoId').value=id; $('metaMontoModo').value=modo; $('metaMontoValor').value='';
  const retiro=modo==='retirar';
  $('tituloMetaMonto').textContent=retiro?t('withdraw_money'):t('add_money');
  $('textoMetaMonto').textContent=meta.nombre;
  $('btnMetaMonto').textContent=retiro?t('withdraw'):t('add');
  abrirModal('modalMetaMonto');
  setTimeout(()=>$('metaMontoValor').focus(),80);
}
function aportarMeta(id){ abrirMetaMonto(id,'aportar'); }
function retirarMeta(id){ abrirMetaMonto(id,'retirar'); }
$('formMetaMonto').addEventListener('submit',e=>{
  e.preventDefault();
  const id=$('metaMontoId').value, modo=$('metaMontoModo').value, val=parseFloat($('metaMontoValor').value);
  const meta=db.metas.find(m=>m.id===id); if(!meta || !val || val<=0) return;
  if(modo==='retirar') meta.ahorrado=Math.max(0,meta.ahorrado-val); else meta.ahorrado=Math.min(meta.objetivo,meta.ahorrado+val);
  guardar(); cerrarModal('modalMetaMonto'); renderTodo();
  toast(modo==='retirar'?t('to_wd_saved'):(meta.ahorrado>=meta.objetivo?t('to_goal_completed'):t('to_add_saved')));
});
function borrarMeta(id){
  confirmarWeb(t('conf_del_goal'),{danger:true}).then(ok=>{
    if(!ok) return;
    db.metas = db.metas.filter(m=>m.id!==id); guardar(); renderTodo(); toast(t('to_goal_del'));
  });
}

// ================= PRÉSTAMOS =================
$('formPrestamo').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('pId').value;
  const data = { nombre:$('pNombre').value.trim(), montoTotal:parseFloat($('pTotal').value), cuotasTotal:parseInt($('pCuotas').value),
    montoCuota:parseFloat($('pMontoCuota').value), diaPago:parseInt($('pDia').value), fechaInicio:$('pFechaInicio').value };
  if(id){
    const p = db.prestamos.find(x=>x.id===id); Object.assign(p, data); toast(t('to_loan_upd'));
  } else {
    db.prestamos.push({ id:uid(), ...data, pagadas:0 }); toast(t('to_loan_reg'));
  }
  guardar(); cancelarEdicionPrestamo(); cerrarModal('modalPrestamo'); renderTodo();
});
function editarPrestamo(id){
  const p = db.prestamos.find(x=>x.id===id); if(!p) return;
  $('pId').value=p.id; $('pNombre').value=p.nombre; $('pTotal').value=p.montoTotal; $('pCuotas').value=p.cuotasTotal;
  $('pMontoCuota').value=p.montoCuota; $('pDia').value=p.diaPago; $('pFechaInicio').value=p.fechaInicio;
  $('tituloFormPrestamo').textContent=t('frm_edit_loan'); $('btnSubmitPrestamo').textContent=t('update_loan'); $('editNotePrestamo').style.display='block'; abrirModal('modalPrestamo');
}
function cancelarEdicionPrestamo(){ $('pId').value=''; $('pNombre').value=''; $('pTotal').value=''; $('pCuotas').value=''; $('pMontoCuota').value=''; $('pDia').value=''; $('pFechaInicio').value=''; $('tituloFormPrestamo').textContent=t('frm_new_loan'); $('btnSubmitPrestamo').textContent=t('register_loan'); $('editNotePrestamo').style.display='none'; cerrarModal('modalPrestamo'); }
function pagarCuota(id, n){
  const p = db.prestamos.find(x=>x.id===id); if(!p) return;
  p.pagadas = p.pagadas || 0;
  if(p.pagadas >= p.cuotasTotal){ toast(t('to_loan_paid_full')); return; }
  n = Math.max(1, Math.min(parseInt(n)||1, p.cuotasTotal - p.pagadas));
  const de = p.pagadas + 1, a2 = p.pagadas + n, total = p.montoCuota * n;
  confirmarWeb(t('confirm_pay_n').replace('{n}',n).replace('{d}',de).replace('{a}',a2).replace('{t}',p.cuotasTotal).replace('{tot}',fmt(total))).then(ok=>{
    if(!ok) return;
    for(let i=0;i<n;i++){
      p.pagadas++;
      db.prestamoPagos.push({ id:uid(), prestamoId:id, nCuota:p.pagadas, monto:p.montoCuota, fecha:hoyISO() });
    }
    db.movimientos.push({ id:uid(), tipo:'gasto', monto:total, categoria:t('cat_loan'), descripcion:t('inst_label_n').replace('{d}',de).replace('{a}',a2).replace('{t}',p.cuotasTotal).replace('{name}',p.nombre), fecha:hoyISO(), auto:true });
    guardar(); renderTodo(); verDetallePrestamo(id); toast(t('to_inst_paid')+(n>1?' ×'+n:''));
  });
}
function borrarPrestamo(id){
  confirmarWeb(t('conf_del_loan'),{danger:true}).then(ok=>{
    if(!ok) return;
    db.prestamos = db.prestamos.filter(p=>p.id!==id); db.prestamoPagos = db.prestamoPagos.filter(x=>x.prestamoId!==id);
    guardar(); renderTodo(); toast(t('to_loan_del'));
  });
}
function fechasCuotas(p){
  const arr=[]; const base=new Date(p.fechaInicio+'T12:00:00');
  if(Number.isNaN(base.getTime())) return arr;
  const total=Math.max(0,Number(p.cuotasTotal)||0), dia=Math.max(1,Math.min(31,Number(p.diaPago)||1));
  for(let i=0;i<total;i++){
    const y=base.getFullYear(), m=base.getMonth()+i;
    const ultimo=new Date(y,m+1,0).getDate();
    const f=new Date(y,m,Math.min(dia,ultimo),12,0,0);
    arr.push(f.getFullYear()+'-'+String(f.getMonth()+1).padStart(2,'0')+'-'+String(f.getDate()).padStart(2,'0'));
  }
  return arr;
}
function proximaCuotaInfo(p){
  if((p.pagadas||0) >= p.cuotasTotal) return null;
  const fechas = fechasCuotas(p);
  return { fecha: fechas[p.pagadas], n: p.pagadas + 1 };
}
function tablaCuotasHTML(id){
  const p = db.prestamos.find(x=>x.id===id); if(!p) return '';
  const fechas = fechasCuotas(p); const hoy = hoyISO();
  let rows='';
  fechas.forEach((f,i)=>{
    const n=i+1;
    const pagada = db.prestamoPagos.some(x=>x.prestamoId===id && x.nCuota===n);
    const estado = pagada ? `<span class="cuota-pagada">${t('paid')}</span>` : (f < hoy ? `<span class="cuota-vencida">${t('overdue')}</span>` : t('pending'));
    rows += `<tr><td>${n}/${p.cuotasTotal}</td><td>${fmtFecha(f)}</td><td>${fmt(p.montoCuota)}</td><td>${estado}</td></tr>`;
  });
  return `<table><thead><tr><th>${t('inst_no')}</th><th>${t('due_date')}</th><th>${t('d_amount')}</th><th>${t('d_status2')}</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function toggleTablaCuotas(id){
  const el = $('cuotasPrestamo'); if(!el) return;
  if(el.style.display==='none'){ el.innerHTML = tablaCuotasHTML(id); el.style.display='block'; }
  else el.style.display='none';
}
function verDetallePrestamo(id){
  const p = db.prestamos.find(x=>x.id===id); if(!p) return;
  const pagos = db.prestamoPagos.filter(x=>x.prestamoId===id);
  const pagadoTotal = pagos.reduce((s,x)=>s+x.monto,0);
  const saldoRestante = Math.max(0,(p.cuotasTotal-p.pagadas)*p.montoCuota);
  const capitalRestante = Math.max(0, p.montoTotal - p.pagadas*p.montoCuota);
  const interesAhorrado = Math.max(0, saldoRestante - capitalRestante);
  const restMeses = p.cuotasTotal - p.pagadas;
  const comPct = restMeses > 12 ? 0.01 : 0.005;
  const comision = capitalRestante * comPct;
  const totalAmortizar = capitalRestante + comision;
  const pct = Math.round(p.pagadas/p.cuotasTotal*100);
  abrirDetalle('🏦 ' + p.nombre,
    `<div class="stat-line"><span>${t('total_borrowed')}</span><b>${fmt(p.montoTotal)}</b></div>
     <div class="stat-line"><span>${t('paid_so_far')}</span><b class="green">${fmt(pagadoTotal)}</b></div>
     <div class="stat-line"><span>${t('d_principal')}</span><b>${fmt(capitalRestante)}</b></div>
     <div class="stat-line"><span>${t('d_saved_interest')}</span><b class="green">−${fmt(interesAhorrado)}</b></div>
     <div class="stat-line"><span>${t('d_progress')}</span><b>${pct}%</b></div>
     <div class="progress" style="margin:12px 0 16px;"><div style="width:${pct}%;background:${pct>=100?'var(--green)':'var(--purple)'};"></div></div>
     <div style="background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:12px;">
       <div class="stat-line"><span>${t('remaining_balance')}</span><b>${fmt(saldoRestante)}</b></div>
       <div class="stat-line"><span>${t('d_penalty')}</span><b class="${comision>0?'yellow':''}">${(comPct*100).toFixed(1).replace('.0','')}% · ${fmt(comision)}</b></div>
       <div class="stat-line" style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px;"><span><b>${t('payoff_total')}</b></span><b class="accent" style="font-size:1.05rem;">${fmt(totalAmortizar)}</b></div>
       <small style="color:var(--muted);display:block;margin-top:8px;">${t('commission_rule')}</small>
     </div>
     <div id="cuotasPrestamo" style="display:none;max-height:280px;overflow-y:auto;"></div>`,
    `${p.pagadas<p.cuotasTotal?`<div style="display:flex;gap:8px;align-items:center;flex:1 1 100%;"><select id="selNPagar" style="flex:1;min-width:90px;padding:9px 10px;font-size:.9rem;">${Array.from({length:p.cuotasTotal-p.pagadas},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select><button class="btn btn-green btn-sm" style="flex:1;" onclick="pagarCuota('${p.id}', document.getElementById('selNPagar').value)">${t('pay_inst')}</button></div>`:`<span class="green" style="font-weight:700;">${t('paid_off')}</span>`}
     <button class="btn btn-ghost btn-sm" onclick="toggleTablaCuotas('${p.id}')">${t('installments_btn')}</button>
     <button class="btn btn-ghost btn-sm" onclick="cerrarModal('modalDetalle');editarPrestamo('${p.id}')">${t('edit')}</button>
     <button class="btn btn-danger btn-sm" onclick="cerrarModal('modalDetalle');borrarPrestamo('${p.id}')">${t('delete')}</button>`);
}

// ================= AJUSTES =================
function exportarDatos(){
  const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mis-finanzas-' + hoyISO() + '.json';
  a.click(); URL.revokeObjectURL(a.href); toast(t('to_exported'));
}
function importarDatos(ev){
  const f = ev.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const data = JSON.parse(r.result);
      if(!Array.isArray(data.movimientos)) throw 0;
      confirmarWeb(t('conf_import'),{danger:true}).then(ok=>{
        if(!ok) return;
        db = normalizarDB(data); LANG=db.lang; $('selLang').value=LANG; $('selMoneda').value=db.moneda; guardar(); aplicarTema(); aplicarIdioma(); renderTodo(); renderFab(vistaActiva()); toast(t('to_imported'));
      });
    }catch(e){ toast(t('invalid_file')); }
  };
  r.readAsText(f); ev.target.value='';
}
function borrarTodo(){
  confirmarWeb(t('conf_del_all_1'),{danger:true}).then(ok=>{
    if(!ok) return;
    confirmarWeb(t('conf_del_all_2'),{danger:true}).then(ok2=>{
      if(!ok2) return;
      localStorage.removeItem(LS_KEY); location.reload();
    });
  });
}

// ================= GRÁFICAS =================
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const CH_BASE_H = 165; // altura base fija: nunca crece entre repintados
function setupCanvas(cv){
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  const w = Math.max(50, cv.clientWidth || (cv.parentElement ? cv.parentElement.clientWidth - 40 : 300));
  const h = Math.round(CH_BASE_H * (window.innerWidth < 769 ? 0.75 : 1)); // siempre desde la base, nunca del atributo
  cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
  cv.style.width = '100%'; cv.style.height = h+'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx, w, h};
}
function renderCharts(){
  // Barras: últimos 6 meses ingresos vs gastos
  const cv = $('chartBarras'); if(!cv || !$('view-panel').classList.contains('active')) return;
  const {ctx,w,h} = setupCanvas(cv);
  const meses=[]; const now=new Date();
  for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); meses.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')); }
  const ing = meses.map(m=>db.movimientos.filter(x=>x.tipo==='ingreso'&&x.fecha.startsWith(m)).reduce((s,x)=>s+x.monto,0));
  const gas = meses.map(m=>db.movimientos.filter(x=>x.tipo==='gasto'&&x.fecha.startsWith(m)).reduce((s,x)=>s+x.monto,0));
  const max = Math.max(1,...ing,...gas);
  const padL=8, padB=26, padT=10, cw=(w-padL*2)/6;
  const nombreMes = m => new Date(m+'-15T12:00').toLocaleDateString(LOCALE(),{month:'short'});
  meses.forEach((m,i)=>{
    const x = padL + i*cw; const bw = Math.min(22, cw/3);
    const hI = (ing[i]/max)*(h-padB-padT); const hG = (gas[i]/max)*(h-padB-padT);
    ctx.fillStyle = cssVar('--green'); roundRect(ctx, x+cw/2-bw-2, h-padB-hI, bw, hI, 4); ctx.fill();
    ctx.fillStyle = cssVar('--red');   roundRect(ctx, x+cw/2+2, h-padB-hG, bw, hG, 4); ctx.fill();
    ctx.fillStyle = cssVar('--muted'); ctx.font='11px system-ui'; ctx.textAlign='center';
    ctx.fillText(nombreMes(m), x+cw/2, h-8);
  });
  // Donut: gastos por categoría mes actual
  const cv2 = $('chartDonut');
  const s2 = setupCanvas(cv2); const ctx2 = s2.ctx;
  const mesAct = hoyISO().slice(0,7);
  const porCat = {};
  db.movimientos.filter(m=>m.tipo==='gasto'&&m.fecha.startsWith(mesAct)).forEach(m=>{ porCat[m.categoria]=(porCat[m.categoria]||0)+m.monto; });
  const entries = Object.entries(porCat).sort((a,b)=>b[1]-a[1]);
  const cx2=s2.w/2, cy2=s2.h/2, R=Math.min(s2.w,s2.h)/2-14, r=R*0.62;
  ctx2.clearRect(0,0,s2.w,s2.h);
  const colores = ['#e5534b','#f2c14e','#4f8cff','#a06bff','#34c98e','#ff9a5c','#4dd0e1','#ef6aa0'];
  if(!entries.length){
    ctx2.fillStyle=cssVar('--muted'); ctx2.font='13px system-ui'; ctx2.textAlign='center';
    ctx2.fillText(t('no_exp_month'), cx2, cy2);
    $('donutLegend').innerHTML='';
  } else {
    const total = entries.reduce((s,e)=>s+e[1],0);
    let ang=-Math.PI/2;
    entries.forEach((e,i)=>{
      const a2 = ang + (e[1]/total)*Math.PI*2;
      ctx2.beginPath(); ctx2.moveTo(cx2,cy2); ctx2.arc(cx2,cy2,R,ang,a2); ctx2.closePath();
      ctx2.fillStyle = colores[i%colores.length]; ctx2.fill();
      ang=a2;
    });
    ctx2.globalCompositeOperation='destination-out';
    ctx2.beginPath(); ctx2.arc(cx2,cy2,r,0,Math.PI*2); ctx2.fill();
    ctx2.globalCompositeOperation='source-over';
    ctx2.fillStyle=cssVar('--text'); ctx2.font='bold 14px system-ui'; ctx2.textAlign='center';
    ctx2.fillText(fmt(total), cx2, cy2+5);
    $('donutLegend').innerHTML = entries.slice(0,6).map((e,i)=>`<span><span class="dot" style="background:${colores[i%colores.length]}"></span>${esc(e[0])} · ${Math.round(e[1]/total*100)}%</span>`).join('');
  }
}
function roundRect(ctx,x,y,w,h,r){
  if(h<=0) return; r=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
let lastWinW = window.innerWidth;
window.addEventListener('resize', ()=>{
  clearTimeout(window.__rz);
  window.__rz = setTimeout(()=>{
    if(!$('view-panel').classList.contains('active')) return;
    if(Math.abs(window.innerWidth - lastWinW) < 1) return; // scroll en móvil: no repintar
    lastWinW = window.innerWidth;
    renderCharts();
  }, 200);
});

// ================= CATEGORÍAS (menú desplegable) =================
function catsGasto(){ return LANG==='en'
  ? ['Food','Transport','Housing','Leisure','Health','Education','Clothing','Subscriptions','Others']
  : ['Comida','Transporte','Vivienda','Ocio','Salud','Educación','Ropa','Suscripciones','Otros']; }
function catsIngreso(){ return LANG==='en'
  ? ['Salary','Freelance','Investments','Sales','Gift','Others']
  : ['Sueldo','Freelance','Inversiones','Ventas','Regalo','Otros']; }
function poblarCategorias(seleccion){
  const tipo = $('mTipo').value;
  const base = tipo==='ingreso' ? catsIngreso() : catsGasto();
  const existentes = [...new Set(db.movimientos.filter(m=>m.tipo===tipo).map(m=>m.categoria))];
  const cats = [...new Set([...base, ...existentes])].sort((a,b)=>a.localeCompare(b, LOCALE()));
  const sel = $('mCategoria'); if(!sel) return;
  const prev = seleccion || sel.value;
  sel.innerHTML = cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  if(prev && cats.includes(prev)) sel.value = prev;
}
$('mTipo').addEventListener('change', ()=>poblarCategorias());

// ================= PRESUPUESTOS DE GASTO =================
if(!db.presupuestos) db.presupuestos = [];
$('formPres').addEventListener('submit', e => {
  e.preventDefault();
  const id=String($('prId').value||'');
  const cat=String($('prCategoria').value||'').trim();
  const limite=Number($('prLimite').value);
  if(!cat || !Number.isFinite(limite) || limite<=0) return;
  const ex=id ? db.presupuestos.find(p=>p.id===id) : db.presupuestos.find(p=>catKey(p.categoria)===cat);
  if(ex){ ex.categoria=cat; ex.limite=limite; toast(t('to_pres_saved')); }
  else { db.presupuestos.push({id:uid(),categoria:cat,limite}); toast(t('to_pres_saved')); }
  guardar(); cancelarEdicionPres(); renderTodo();
});
function catKey(cat){
  const raw=String(cat||'').trim();
  if(!raw) return '';
  const map={
    'Comida':'food','Food':'food','Transporte':'transport','Transport':'transport','Vivienda':'housing','Housing':'housing','Ocio':'leisure','Leisure':'leisure','Salud':'health','Health':'health','Educación':'education','Education':'education','Ropa':'clothing','Clothing':'clothing','Suscripciones':'subscriptions','Subscriptions':'subscriptions','Otros':'others','Others':'others'
  };
  return map[raw]||raw.toLowerCase();
}
function catLabel(key){
  const map={food:['Comida','Food'],transport:['Transporte','Transport'],housing:['Vivienda','Housing'],leisure:['Ocio','Leisure'],health:['Salud','Health'],education:['Educación','Education'],clothing:['Ropa','Clothing'],subscriptions:['Suscripciones','Subscriptions'],others:['Otros','Others']};
  return (map[key]||[key,key])[LANG==='en'?1:0];
}
function renderPresupuestos(){
  const sel=$('prCategoria'); if(!sel) return;
  const prev=sel.value;
  const keys=[...new Set([
    ...catsGasto().map(catKey),
    ...db.movimientos.filter(m=>m.tipo==='gasto').map(m=>catKey(m.categoria)),
    ...db.presupuestos.map(p=>catKey(p.categoria))
  ].filter(Boolean))].sort((a,b)=>catLabel(a).localeCompare(catLabel(b),LOCALE()));

  sel.innerHTML=keys.length
    ? keys.map(k=>`<option value="${esc(k)}">${esc(catLabel(k))}</option>`).join('')
    : '<option value="">—</option>';

  if(prev && keys.includes(prev)){
    sel.value=prev;
  }else if(db.presupuestos.length){
    const firstExisting=catKey(db.presupuestos[0].categoria);
    if(keys.includes(firstExisting)) sel.value=firstExisting;
  }
  const mesAct=hoyISO().slice(0,7);
  $('listaPres').innerHTML=db.presupuestos.length?db.presupuestos.map(p=>{
    const key=catKey(p.categoria);
    const gastado=db.movimientos.filter(m=>m.tipo==='gasto'&&catKey(m.categoria)===key&&m.fecha.startsWith(mesAct)).reduce((s,m)=>s+m.monto,0);
    const pct=p.limite>0?Math.min(100,Math.round(gastado/p.limite*100)):0; const over=gastado>p.limite;
    const restante=Math.max(0,p.limite-gastado);
    const estado=over ? `<span class="red budget-status">${t('pres_over')}</span>` : pct>=85 ? `<span class="yellow budget-status">${t('pres_near')}</span>` : `<span class="green budget-status">${t('pres_ok')}</span>`;
    return `<div class="budget-item ${over?'alert-blink':''}" data-budget-id="${p.id}" role="button" tabindex="0">
      <div class="budget-head"><div><b>${esc(catLabel(key))}</b><small>${t('pres_month')}</small></div>${estado}</div>
      <div class="budget-values"><b>${fmt(gastado)}</b><span>${t('k_of')} ${fmt(p.limite)}</span><strong>${pct}%</strong></div>
      <div class="progress budget-progress"><div style="width:${pct}%;background:${over?'var(--red)':pct>=85?'var(--yellow)':'var(--accent)'}"></div></div>
      <div class="budget-footer"><span>${over ? t('pres_over_by')+' '+fmt(gastado-p.limite) : t('pres_left')+' '+fmt(restante)}</span><span>${t('tap_options')}</span></div>
    </div>`;
  }).join(''):`<div class="empty">${t('no_pres')}</div>`;
}
function verDetallePresupuesto(id){
 const p=db.presupuestos.find(x=>x.id===id); if(!p)return; const key=catKey(p.categoria), mes=hoyISO().slice(0,7);
 const gastado=db.movimientos.filter(m=>m.tipo==='gasto'&&catKey(m.categoria)===key&&m.fecha.startsWith(mes)).reduce((s,m)=>s+m.monto,0);
 const pct=p.limite?Math.min(100,Math.round(gastado/p.limite*100)):0;
 abrirDetalle(t('pres_title'),`<div class="stat-line"><span>${t('lbl_category')}</span><b>${esc(catLabel(key))}</b></div><div class="stat-line"><span>${t('k_of')}</span><b>${fmt(gastado)} / ${fmt(p.limite)}</b></div><div class="stat-line"><span>${t('d_progress')}</span><b>${pct}%</b></div><div class="progress" style="margin-top:12px"><div style="width:${pct}%;background:${gastado>p.limite?'var(--red)':'var(--accent)'}"></div></div>`,`<button class="btn btn-ghost btn-sm" onclick="cerrarModal('modalDetalle');editarPresupuesto('${p.id}')">${t('edit')}</button><button class="btn btn-danger btn-sm" onclick="cerrarModal('modalDetalle');borrarPresupuesto('${p.id}')">${t('delete')}</button>`);
}

// ================= RENDER =================
function renderTodo(){
  const mesActual = hoyISO().slice(0,7);
  const ingresos = db.movimientos.filter(m=>m.tipo==='ingreso' && m.fecha.startsWith(mesActual)).reduce((s,m)=>s+m.monto,0);
  const gastos = db.movimientos.filter(m=>m.tipo==='gasto' && m.fecha.startsWith(mesActual)).reduce((s,m)=>s+m.monto,0);
  const balance = db.movimientos.reduce((s,m)=>s + (m.tipo==='ingreso'?m.monto:-m.monto),0);

  $('pBalance').textContent = fmt(balance);
  $('pBalance').className = 'big ' + (balance>=0?'green':'red');
  const balanceCard=$('pBalance').closest('.card'); if(balanceCard) balanceCard.classList.toggle('balance-alert',balance<0);
  $('pBalanceSub').textContent = db.movimientos.length + ' ' + t('movs_registered');
  $('pIngresos').textContent = fmt(ingresos);
  $('pGastos').textContent = fmt(gastos);
  const ahorro = ingresos - gastos;
  $('pAhorroMes').innerHTML = ahorro>=0 ? `${t('net_saving')} <b class="green">${fmt(ahorro)}</b>` : `${t('deficit')} <b class="red">${fmt(-ahorro)}</b>`;

  const limite = new Date(); limite.setDate(limite.getDate()+15);
  const cobrosProx = db.cobros.filter(c=>c.activo && new Date(c.proxima)<=limite);
  const prestamosProx = db.prestamos.filter(p=>(p.pagadas||0)<p.cuotasTotal)
    .filter(p=>{ const info = proximaCuotaInfo(p); return info && new Date(info.fecha+'T23:59:59')<=limite; });
  const totalProximo = cobrosProx.reduce((s,c)=>s+c.monto,0) + prestamosProx.reduce((s,p)=>s+p.montoCuota,0);
  $('pCobros').textContent = fmt(totalProximo);
  $('pCobrosSub').textContent = (cobrosProx.length + prestamosProx.length) + ' ' + t('bills_pending');
  const saldoDespues = balance - totalProximo;
  $('pSaldoDespuesCobros').textContent = fmt(saldoDespues);
  $('pSaldoDespuesCobros').className = 'big ' + (saldoDespues>=0?'green':'red');
  $('pSaldoDespuesCobrosSub').textContent = t('kpi_after_due_sub');


  const cobrosActivos = db.cobros.filter(c=>c.activo).sort((a,b)=>a.proxima.localeCompare(b.proxima));
  const prestamosProximos = db.prestamos.filter(p=>(p.pagadas||0)<p.cuotasTotal)
    .map(p=>({p, info:proximaCuotaInfo(p)}))
    .filter(x=>x.info && new Date(x.info.fecha+'T23:59:59')<=limite)
    .sort((a,b)=>a.info.fecha.localeCompare(b.info.fecha));
  const hayCobros = cobrosActivos.length>0 || prestamosProximos.length>0;
  $('pCobrosLista').innerHTML = hayCobros ? `<table><tbody>${[
    ...cobrosActivos.map(c=>`<tr><td>${esc(c.concepto)}</td><td style="text-align:right" class="red">−${fmt(c.monto)}</td>
    <td style="text-align:right"><span class="badge-proximo countdown-holder" data-cd="${c.id}">—</span></td></tr>`),
    ...prestamosProximos.map(({p})=>`<tr><td>${esc(p.nombre)} <small style="color:var(--muted)">${t('cat_loan')}</small></td><td style="text-align:right" class="red">−${fmt(p.montoCuota)}</td>
    <td style="text-align:right"><span class="badge-proximo countdown-holder" data-cdp="${p.id}">—</span></td></tr>`)
  ].join('')}</tbody></table>`
    : `<div class="empty">${t('no_bills')}</div>`;
  poblarCategorias();

  // Filtro de meses
  const mesesDisponibles = [...new Set(db.movimientos.map(m=>m.fecha.slice(0,7)))].sort().reverse();
  const selMes = $('fMes').value;
  $('fMes').innerHTML = '<option value="">'+t('all_months')+'</option>' + mesesDisponibles.map(m=>{
    const lbl = new Date(m+'-15T12:00').toLocaleDateString(LOCALE(),{month:'long',year:'numeric'});
    return `<option value="${m}" ${m===selMes?'selected':''}>${lbl}</option>`;
  }).join('');

  renderMovimientos();
  renderCobros();
  renderMetas();
  renderPrestamos();
  renderPresupuestos();
  updateCountdowns();
  renderPerfil();
  aplicarTema();
  setTimeout(renderCharts, 50);
}

function renderMovimientos(){
  const q = ($('fBuscar').value||'').toLowerCase();
  const tipo = $('fTipo').value; const mes = $('fMes').value;
  let movs = [...db.movimientos].sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if(tipo) movs = movs.filter(m=>m.tipo===tipo);
  if(mes) movs = movs.filter(m=>m.fecha.startsWith(mes));
  if(q) movs = movs.filter(m=>(m.categoria+' '+ (m.descripcion||'')).toLowerCase().includes(q));
  const total = movs.reduce((s,m)=>s + (m.tipo==='ingreso'?m.monto:-m.monto),0);
  $('movCount').textContent = movs.length + ' ' + t('k_results');
  $('movTotal').textContent = t('k_net') + ' ' + fmt(total);
  const visibles = movs.slice(0, movLimit);
  let footer = '';
  if(movs.length > movLimit){
    footer = `<tr><td colspan="3" style="padding:12px 6px 4px;"><button class="btn btn-ghost btn-block btn-sm" onclick="verMasMovs()">${t('show_more')}${movs.length - visibles.length}${t('remaining')}</button></td></tr>`;
  } else if(movLimit > 10){
    footer = `<tr><td colspan="3" style="padding:12px 6px 4px;"><button class="btn btn-ghost btn-block btn-sm" onclick="verMenosMovs()">${t('show_less')}</button></td></tr>`;
  }
  $('tablaMov').innerHTML = movs.length ? visibles.map(m=>`
    <tr class="mov-row" onclick="verDetalleMov('${m.id}')">
    <td><span class="tag tag-${m.tipo}" style="font-size:.6rem;padding:2px 6px;">${m.tipo==='ingreso'?'▲':'▼'}</span>${m.auto?' <span class="tag-auto">auto</span>':''} ${esc(m.categoria)}</td>
    <td class="cell-dim">${fmtFechaCorta(m.fecha)}</td>
    <td style="text-align:right" class="${m.tipo==='ingreso'?'green':'red'}">${m.tipo==='ingreso'?'+':'−'}${fmt(m.monto)}</td></tr>`).join('') + footer : '<tr><td colspan="3"><div class="empty">'+t('no_results')+'</div></td></tr>';
}
function verMasMovs(){ movLimit += 10; renderMovimientos(); }
function verMenosMovs(){ movLimit = 10; renderMovimientos(); }
function renderCobros(){
  const cobros = [...db.cobros].sort((a,b)=>(a.activo===b.activo? a.proxima.localeCompare(b.proxima) : (a.activo?-1:1)));
  const freqTxt = {unico:t('f_unico'), mensual:t('f_mensual'), semanal:t('f_semanal'), anual:t('f_anual')};
  $('tablaCobros').innerHTML = cobros.length ? cobros.map(c=>`
    <tr class="mov-row bill-row" data-bill-id="${c.id}" style="${c.activo?'':'opacity:.45'}"><td><span class="dot" style="background:${c.activo?'var(--green)':'var(--muted)'};width:8px;height:8px;margin-right:4px;"></span><b>${esc(c.concepto)}</b></td>
    <td class="cell-dim">${fmtFechaCorta(c.proxima)}</td>
    <td class="red" style="text-align:right">−${fmt(c.monto)}</td></tr>`).join('')
    : '<tr><td colspan="3"><div class="empty">'+t('no_bills')+'</div></td></tr>';
}
function renderMetas(){
  $('listaMetas').innerHTML = db.metas.length ? db.metas.map(g=>{
    const objetivo = Number(g.objetivo)||0;
    const ahorrado = Number(g.ahorrado)||0;
    const pct = objetivo>0 ? Math.min(100, Math.round(ahorrado/objetivo*100)) : 0;
    const restante = Math.max(0, objetivo-ahorrado);
    let diasRestantes = null, ahorroMensual = null;
    if(g.fechaObjetivo){
      const hoy=new Date(); hoy.setHours(0,0,0,0);
      const fecha=new Date(g.fechaObjetivo+'T00:00:00');
      diasRestantes=Math.max(0,Math.ceil((fecha-hoy)/86400000));
      const meses=Math.max(1,diasRestantes/30.44);
      ahorroMensual=restante/meses;
    }
    return `<div class="goal-card ${pct>=100?'goal-complete':''}" data-goal-id="${g.id}" role="button" tabindex="0">
      <div class="goal-head">
        <div class="goal-name-wrap"><span class="goal-icon">🎯</span><div><b class="goal-name">${esc(g.nombre)}</b>${pct>=100?`<span class="goal-status green">${t('completed')}</span>`:''}</div></div>
        <b class="goal-percent ${pct>=100?'green':'accent'}">${pct}%</b>
      </div>
      <div class="progress goal-progress"><div style="width:${pct}%;background:${pct>=100?'var(--green)':'var(--accent)'};"></div></div>
      <div class="goal-amounts"><span><b>${fmt(ahorrado)}</b> ${t('k_saved_short')}</span><span>${t('k_of')} <b>${fmt(objetivo)}</b></span></div>
      <div class="goal-footer">
        <span>${restante>0 ? t('k_left')+' '+fmt(restante) : t('completed')}</span>
        ${g.fechaObjetivo ? `<span>${diasRestantes===0 ? t('k_due_today') : diasRestantes+' '+t('k_days_left')}</span>` : ''}
      </div>
      ${ahorroMensual!==null && restante>0 ? `<div class="goal-plan">💡 ${t('k_save_monthly')} <b>${fmt(ahorroMensual)}</b> / ${t('k_month')}</div>` : ''}
    </div>`;
  }).join('') : `<div class="empty">${t('no_goals_first')}</div>`;
}
function renderPrestamos(){
  $('listaPrestamos').innerHTML = db.prestamos.length ? db.prestamos.map(p=>{
    const restante = (p.cuotasTotal-p.pagadas)*p.montoCuota;
    const pct = Math.round(p.pagadas/p.cuotasTotal*100);
    return `<div class="loan-card" data-loan-id="${p.id}" role="button" tabindex="0">
      <div class="row-between"><b class="loan-title">${esc(p.nombre)}</b><span class="yellow loan-balance">${p.pagadas>=p.cuotasTotal?t('paid_off'):t('you_have_left')+fmt(restante)}</span></div>
      <div class="progress"><div style="width:${pct}%;background:${pct>=100?'var(--green)':'var(--purple)'};"></div></div>
      <small class="loan-meta">${p.pagadas}/${p.cuotasTotal} ${t('k_insts')} &nbsp;•&nbsp; ${fmt(p.montoCuota)} / ${t('k_inst')} &nbsp;•&nbsp; ${t('k_day')}${p.diaPago}<br><span style="color:var(--accent);">${t('tap_options')}</span></small>
    </div>`;
  }).join('') : t('no_loans_empty');
}

// Apertura directa y prioritaria de tarjetas completas.
document.addEventListener('click', e=>{
  const el=e.target.closest('.loan-card,.budget-item');
  if(!el || e.target.closest('button,select,a,input,textarea,[data-no-open]')) return;
  e.preventDefault();
  e.stopPropagation();
  if(el.classList.contains('loan-card')) verDetallePrestamo(el.dataset.loanId);
  else if(el.classList.contains('budget-item')) verDetallePresupuesto(el.dataset.budgetId);
}, true);

// Los préstamos y presupuestos se abren desde el listener prioritario anterior.
// Este listener queda solo para cobros y metas.
document.addEventListener('click', e=>{
  const clickable = e.target.closest('.bill-row,.goal-card');
  if(!clickable) return;
  if(e.target.closest('button,select,a,input,textarea,[data-no-open]')) return;
  if(clickable.classList.contains('bill-row')) verDetalleCobro(clickable.dataset.billId);
  else if(clickable.classList.contains('goal-card')) verDetalleMeta(clickable.dataset.goalId);
});
document.addEventListener('keydown', e=>{
  if((e.key==='Enter'||e.key===' ') && e.target.closest('.loan-card,.bill-row,.goal-card,.budget-item')){
    e.preventDefault();
    e.target.closest('.loan-card,.bill-row,.goal-card,.budget-item').click();
  }
});

// No desplazar automáticamente la página al enfocar campos: evita saltos al cerrar modales en iOS.

// ================= BLOQUEO DE ZOOM =================
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), {passive:false});
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const ahora = Date.now();
  if(ahora - lastTouchEnd <= 300) e.preventDefault(); // doble toque = zoom
  lastTouchEnd = ahora;
}, {passive:false});

// ================= DIVISAS =================
// ================= DIVISAS =================
// Solo mostramos monedas conocidas/útiles para evitar una lista enorme.
// El orden de FAVORITAS siempre va primero.
const FX_POPULARES = [
  'EUR','USD','GBP','JPY','CHF','CAD','AUD','NZD',
  'MXN','BRL','CNY','INR','KRW','PLN','SEK','NOK','DKK'
];
const FX_INFO = {
  EUR:['🇪🇺','Euro','Euro'],
  USD:['🇺🇸','Dólar estadounidense','US Dollar'],
  GBP:['🇬🇧','Libra esterlina','British Pound'],
  JPY:['🇯🇵','Yen japonés','Japanese Yen'],
  CHF:['🇨🇭','Franco suizo','Swiss Franc'],
  CAD:['🇨🇦','Dólar canadiense','Canadian Dollar'],
  AUD:['🇦🇺','Dólar australiano','Australian Dollar'],
  NZD:['🇳🇿','Dólar neozelandés','New Zealand Dollar'],
  MXN:['🇲🇽','Peso mexicano','Mexican Peso'],
  BRL:['🇧🇷','Real brasileño','Brazilian Real'],
  CNY:['🇨🇳','Yuan chino','Chinese Yuan'],
  INR:['🇮🇳','Rupia india','Indian Rupee'],
  KRW:['🇰🇷','Won surcoreano','South Korean Won'],
  PLN:['🇵🇱','Zloty polaco','Polish Zloty'],
  SEK:['🇸🇪','Corona sueca','Swedish Krona'],
  NOK:['🇳🇴','Corona noruega','Norwegian Krone'],
  DKK:['🇩🇰','Corona danesa','Danish Krone']
};
let fxRequestId=0;

function fxNombre(cur){
  const x=FX_INFO[cur];
  return x ? (LANG==='en'?x[2]:x[1]) : cur;
}
function fxDecimales(cur){ return ['JPY','KRW'].includes(cur) ? 2 : 4; }

async function actualizarDivisas(force=false){
  const box=$('fxRates'); if(!box) return;
  const requestId=++fxRequestId;
  const base=(db.moneda||'EUR').toUpperCase();
  $('fxBaseLabel').textContent=base;
  box.innerHTML='<div class="empty" style="grid-column:1/-1">…</div>';

  // Cache de 15 minutos para evitar peticiones innecesarias.
  const cacheKey='fx_cache_'+base;
  const now=Date.now();
  let data=null;
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
    if(!force && cached && cached.rates && now-cached.ts<15*60*1000) data=cached;
  }catch(_){}

  if(!data){
    const endpoints=[
      'https://open.er-api.com/v6/latest/'+encodeURIComponent(base),
      'https://api.frankfurter.app/latest?from='+encodeURIComponent(base)
    ];
    for(const url of endpoints){
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),6500);
        const res=await fetch(url,{cache:'no-store',signal:controller.signal});
        clearTimeout(timer);
        if(!res.ok) continue;
        const json=await res.json();
        if(json && json.rates && Object.keys(json.rates).length){
          data={rates:json.rates,ts:now};
          try{localStorage.setItem(cacheKey,JSON.stringify(data));}catch(_){}
          break;
        }
      }catch(_){}
    }
  }

  if(requestId!==fxRequestId) return;

  if(!data){
    box.innerHTML=`<div class="empty" style="grid-column:1/-1">${LANG==='en'?'Unable to load exchange rates. Check your connection and try again.':'No se pudieron cargar los tipos de cambio. Comprueba la conexión e inténtalo de nuevo.'}</div>`;
    return;
  }

  if(!Array.isArray(db.divisaFavoritas)) db.divisaFavoritas=['USD','GBP','JPY'];
  // Limpia favoritos que ya no sean populares o no existan en la respuesta.
  db.divisaFavoritas=db.divisaFavoritas.filter(c=>FX_POPULARES.includes(c) && c!==base && data.rates[c]!==undefined);
  const disponibles=FX_POPULARES.filter(c=>c!==base && data.rates[c]!==undefined);
  const favs=db.divisaFavoritas;
  const rest=disponibles.filter(c=>!favs.includes(c));

  const card=cur=>{
    const val=Number(data.rates[cur]);
    const shown=val.toFixed(fxDecimales(cur));
    const fav=favs.includes(cur);
    const info=FX_INFO[cur]||['💱',cur,cur];
    return `<div class="card rate-card ${fav?'is-favorite':''}">
      <div class="rate-card-top">
        <div class="rate-currency">
          <span class="rate-flag">${info[0]}</span>
          <div style="min-width:0"><b class="rate-code">${cur}</b><div class="rate-name">${esc(fxNombre(cur))}</div></div>
        </div>
        <button type="button" class="fx-fav ${fav?'active':''}" onclick="toggleDivisaFavorita('${cur}')" aria-label="${fav?(LANG==='en'?'Remove from favorites':'Quitar de favoritos'):(LANG==='en'?'Add to favorites':'Añadir a favoritos')}" title="${fav?(LANG==='en'?'Remove from favorites':'Quitar de favoritos'):(LANG==='en'?'Add to favorites':'Añadir a favoritos')}">${fav?'★':'☆'}</button>
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:13px">
        <span class="rate-meta" style="margin:0">1 ${base}</span>
        <span class="rate-value">${shown} ${cur}</span>
      </div>
    </div>`;
  };

  const favHtml=favs.length
    ? favs.map(card).join('')
    : `<div class="fx-empty-favs">${LANG==='en'?'Tap ☆ on a currency to keep it here.':'Pulsa ☆ en una divisa para tenerla siempre aquí.'}</div>`;

  box.innerHTML=`
    <div style="grid-column:1/-1">
      <div class="fx-favorites-head">
        <span class="fx-favorites-title">${LANG==='en'?'★ Favorites':'★ Favoritas'}</span>
        <span class="fx-favorites-count">${favs.length}</span>
      </div>
      <div class="currency-grid">${favHtml}</div>
      <div class="fx-all-title">${LANG==='en'?'Popular currencies':'Divisas populares'}</div>
      <div class="currency-grid">${rest.map(card).join('')||'<div class="empty" style="grid-column:1/-1">—</div>'}</div>
    </div>`;

  guardar();
  $('fxUpdated').textContent=t('fx_updated')+': '+new Date().toLocaleTimeString(LOCALE(),{hour:'2-digit',minute:'2-digit'});
}

function toggleDivisaFavorita(cur){
  if(!FX_POPULARES.includes(cur)) return;
  if(!Array.isArray(db.divisaFavoritas)) db.divisaFavoritas=[];
  const i=db.divisaFavoritas.indexOf(cur);
  if(i>=0) db.divisaFavoritas.splice(i,1);
  else db.divisaFavoritas.unshift(cur);
  guardar();
  actualizarDivisas();
}

// ================= INICIO =================
$('fechaHoy').textContent = new Date().toLocaleDateString(LOCALE(),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
$('mFecha').value = hoyISO(); $('cFecha').value = hoyISO();
aplicarTema();
$('selLang').value = LANG;
$('selMoneda').value = db.moneda || 'EUR';
aplicarIdioma();
aplicarCobrosVencidos();
renderTodo();
const PAGE_VIEW = document.body.dataset.pageView || 'panel';
renderFab(PAGE_VIEW);
if(PAGE_VIEW==='panel') setTimeout(renderCharts,60);
if(PAGE_VIEW==='divisas') actualizarDivisas();