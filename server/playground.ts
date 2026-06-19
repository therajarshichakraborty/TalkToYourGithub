import { corsair } from "./corsair";

// With multiTenancy: true, all plugin access must go through withTenant()
// corsair.github is undefined — that's correct and expected
// const tenant = (corsair as any).withTenant("test_user");

// const result = await tenant.github.api.repositories.listCommits({
//     owner: "therajarshichakraborty",
//     repo: "ApexZero",
// });

// let count = 0;
// (result as any[]).forEach((element: any) => {
//     count++;
//     console.log(`${count}. ${element.commit.message}`);
// });



const repos = await corsair.withTenant('test_user').github.db.repositories.search({ limit: 100 });
console.log(repos.length);