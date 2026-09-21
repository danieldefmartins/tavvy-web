'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {prepareDraftImport}=require('../cruises/prepare-draft-import.cjs');
const input=()=>({schemaVersion:1,operators:[{id:'fixture-line',name:'Fixture Line',official_url:'https://example.invalid'}],ships:[{
 ship:{id:'dcac0000-0000-4000-8000-000000000011',universe_id:'dcac0000-0000-4000-8000-000000000001',slug:'fixture-ship',name:'Fixture Ship',operator_id:'fixture-line',operator_name:'Fixture Line',kind:'ocean',publication_status:'draft',operating_status:'unknown',identity_verified:false,overnight_public_cruise:true,status_source_ids:[],imo:null,eni:null,official_url:null,photo:null,facts:[],name_history:[],cabin_categories:[]},sources:[],venues:[],programs:[]}]});
test('draft tool prepares a transaction that rolls back and never publishes or mutates existing catalog',()=>{
 const sql=prepareDraftImport(input());assert(sql.includes('BEGIN;'));assert(sql.trim().endsWith('ROLLBACK;'));
 assert(!/^\s*COMMIT\s*;/mi.test(sql));assert(!/\b(?:UPDATE|DELETE FROM|TRUNCATE)\s+public\./i.test(sql));
 assert(sql.includes("'draft','cruise_ship',false,NULL"));assert(sql.includes('Existing canonical ship candidate'));
 assert(sql.includes('Existing historical ship name'));assert(sql.includes('Existing Universe candidate'));
 assert(sql.includes('Draft became publicly readable'));assert(sql.includes('LOCK TABLE public.cruise_ships'));
});
test('refuses publication, unreviewed photo/venue linkage and duplicate identities',()=>{
 let d=input();d.ships[0].ship.publication_status='published';assert.throws(()=>prepareDraftImport(d));
 d=input();d.ships[0].ship.photo={url:'https://example.invalid/photo'};assert.throws(()=>prepareDraftImport(d),/photos/);
 d=input();d.ships.push(structuredClone(d.ships[0]));assert.throws(()=>prepareDraftImport(d),/duplicate/);
});
test('untrusted strings remain inside a deterministic hash-delimited JSON payload',()=>{
 const d=input();d.ships[0].ship.name="Ship '; COMMIT; -- $cruise$";
 const sql=prepareDraftImport(d),match=sql.match(/VALUES \((\$cruise_[a-f0-9]+\$)(.*?)\1::jsonb\);/s);
 assert(match);assert.equal(JSON.parse(match[2]).ships[0].ship.name,d.ships[0].ship.name);
 assert.equal(sql,prepareDraftImport(d));
});
