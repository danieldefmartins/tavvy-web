const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function load(file){const exports={};new Function('exports',ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);return exports;}
const {formatPlaceDistance}=load('lib/placeDistance.ts');
const {categoryImageGroup,categoryImageForPlace,placePreviewImage,realPlacePhotos}=load('lib/placePreviewImage.ts');
test('distances stay in meters until presentation, including zero and invalid locations',()=>{
  assert.equal(formatPlaceDistance(16000),'9.9 mi');assert.equal(formatPlaceDistance(833.9),'0.5 mi');assert.equal(formatPlaceDistance(0),'Nearby');
  assert.equal(formatPlaceDistance(16000,'kilometers'),'16.0 km');
  for(const value of [null,undefined,NaN,Infinity,-1,'16000'])assert.equal(formatPlaceDistance(value),'');
});
test('real uploaded photos replace category images immediately without persisting placeholders',()=>{
  const place={id:'example-1',category:'Restaurant',subcategory:'Italian Restaurant'};
  const placeholder=placePreviewImage(place);assert.equal(placeholder.isCategory,true);
  for(const fields of [{cover_image_url:'https://example.test/cover.jpg'},{photos:['https://example.test/gallery.jpg']},{photos:[{url:'https://example.test/gallery.jpg'}]},{photo_url:'https://example.test/photo.jpg'}]){
    const image=placePreviewImage({...place,...fields});assert.equal(image.isCategory,false);assert.match(image.src,/^https:\/\/example.test/);
  }
  assert.deepEqual(realPlacePhotos({...place,photos:[placeholder.src,'javascript:bad','https://example.test/a.jpg','https://example.test/a.jpg']}),['https://example.test/a.jpg']);
  assert.equal(placePreviewImage({...place,cover_image_url:'https://example.test/cover.jpg',photos:['https://example.test/gallery.jpg']}).src,'https://example.test/cover.jpg');
});
test('specific categories take priority and category variation stays stable',()=>{
  assert.equal(categoryImageGroup({id:'one',category:'Dining and Drinking',subcategory:'Coffee Shop'}),'cafe');
  assert.equal(categoryImageGroup({id:'one',category:'Professional Services',subcategory:'Pet Store'}),'pets');
  assert.match(categoryImageForPlace({id:'one',category:'Restaurant',subcategory:'Japanese Restaurant'}),/restaurant-3.webp$/);
  const place={id:'stable-identity',category:'Hotel'};assert.equal(categoryImageForPlace(place),categoryImageForPlace({...place}));
  assert.equal(new Set(Array.from({length:100},(_,i)=>categoryImageForPlace({id:String(i),category:'Hotel'}))).size,5);
});
