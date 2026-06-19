import { corsair } from "./corsair";

// const result = await corsair.github.api.repositories.listCommits({
//     owner: "therajarshichakraborty",
//     repo: "ApexZero",
// })


// console.log(result);


const nerResult = await corsair.github.api.repositories.listCommits({
    owner: "therajarshichakraborty",
    repo: "ApexZero",
});

let count = 0;
(nerResult as any).forEach((element: any) => {
    count++;
    console.log(`${count}. ${element.commit.message}`);
});