import assert from "node:assert/strict";
import test from "node:test";
import { matchesUserSearch } from "../src/utils/user-search";
const mikhail={first_name:"Михаил",last_name:"Семёнов",middle_name:"Иванович",login:"m.semenov"};
test("search understands nicknames, ё, case and multiword names in any order",()=>{
  for(const query of ["Миша","МИША","  миша   семенов ","СЕМЁНОВ МИША","Иванович миш","m.semenov",""])assert.equal(matchesUserSearch(mikhail,query),true,query);
  for(const query of ["Дима","Миша Петров","Павел"])assert.equal(matchesUserSearch(mikhail,query),false,query);
});
test("aliases are symmetric and ambiguous nicknames find both genders",()=>{
  for(const name of ["Александр","Александра","Саша"])assert.equal(matchesUserSearch({...mikhail,first_name:name},"Саша"),true);
  for(const [name,query] of [["Дмитрий","Дима"],["Анастасия","Настя"],["Екатерина","Катя"],["Алексей","Лёша"],["Евгений","Женя"],["Евгения","Женя"],["Миша","Михаил"]])assert.equal(matchesUserSearch({...mikhail,first_name:name},query),true,name);
  assert.equal(matchesUserSearch({...mikhail,first_name:"Павел",last_name:"Михайлов"},"Миша"),false);
});
